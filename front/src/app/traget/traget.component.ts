import { Component, OnInit } from '@angular/core';
import { Traget } from '../Model/Target';
import { TragetService } from '../Services/traget.service';
import { AuthService } from '../core/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-traget',
  templateUrl: './traget.component.html',
  styleUrls: ['./traget.component.css']
})
export class TragetComponent implements OnInit {
  tragets: Traget[] = [];
  filteredTragets: Traget[] = [];
  traget: Traget = {};
  searchText: string = '';
  isEdit = false;
  showEditor = false;
  pendingDeleteId: number | null = null;

  mySalarie: any = null;
  allBuses: any[] = [];
  selectedTragetId: number | null = null;
  selectedBusLabel = '';
  compatibleStations: any[] = [];
  stationsLoading = false;
  selectionMsg = '';
  selectionError = false;

  constructor(private tragetService: TragetService, public auth: AuthService, private http: HttpClient) {}

  ngOnInit(): void {
    this.loadData();
    if (!this.auth.isAdmin()) {
      this.loadMySalarie();
      this.loadBuses();
    }
  }

  loadMySalarie(): void {
    const username = (this.auth.currentUser?.username || '').toLowerCase();
    this.http.get<any[]>('http://localhost:8081/Bus-tracking/salaries/all').subscribe({
      next: (res) => {
        this.mySalarie = (res || []).find((s: any) =>
          (s.matricule || '').toLowerCase() === username
        ) || null;
        if (this.mySalarie) {
          this.selectedTragetId = this.mySalarie.bus?.traget?.id ?? null;
          this.selectedBusLabel = this.mySalarie.bus?.designation ?? '';
          if (this.selectedTragetId) {
            this.loadCompatibleStations(this.selectedTragetId);
          }
        }
      }
    });
  }

  loadCompatibleStations(trajetId: number): void {
    this.stationsLoading = true;
    this.http.get<any[]>(`http://localhost:8081/Bus-tracking/stations/by-traget/${trajetId}`).subscribe({
      next: (s) => { this.compatibleStations = s || []; this.stationsLoading = false; },
      error: () => { this.compatibleStations = []; this.stationsLoading = false; }
    });
  }

  loadBuses(): void {
    this.http.get<any[]>('http://localhost:8081/Bus-tracking/buses/getAll').subscribe({
      next: (res) => (this.allBuses = res || [])
    });
  }

  selectTrajet(trajet: Traget): void {
    if (!this.mySalarie) return;
    const bus = this.allBuses.find((b: any) => b.traget?.id === trajet.id);
    if (!bus) {
      this.selectionMsg = `⚠ Aucun bus disponible pour le trajet « ${trajet.libelle} ».`;
      this.selectionError = true;
      return;
    }
    // Charger les stations du trajet
    this.http.get<any[]>(`http://localhost:8081/Bus-tracking/stations/by-traget/${trajet.id}`).subscribe({
      next: (stations) => {
        const firstStation = (stations || [])[0];
        const payload: any = {
          matricule: this.mySalarie.matricule,
          nom: this.mySalarie.nom,
          prenom: this.mySalarie.prenom,
          bus: { id: bus.id },
          station: firstStation ? { id: firstStation.id } : { id: this.mySalarie.station?.id }
        };
        this.http.put(`http://localhost:8081/Bus-tracking/salaries/update/${this.mySalarie.id}`, payload).subscribe({
          next: () => {
            this.selectedTragetId = trajet.id ?? null;
            this.selectedBusLabel = bus.designation;
            this.compatibleStations = stations || [];
            this.mySalarie.bus = bus;
            if (firstStation) this.mySalarie.station = firstStation;
            const stMsg = firstStation ? ` → Station « ${firstStation.libelle} » assignée` : '';
            this.selectionMsg = `✔ Trajet « ${trajet.libelle} » sélectionné → Bus « ${bus.designation} »${stMsg}.`;
            this.selectionError = false;
          },
          error: () => {
            this.selectionMsg = 'Erreur lors de la mise à jour.';
            this.selectionError = true;
          }
        });
      },
      error: () => {
        // Aucune station liée : mettre à jour uniquement le bus
        const payload: any = {
          matricule: this.mySalarie.matricule,
          nom: this.mySalarie.nom,
          prenom: this.mySalarie.prenom,
          bus: { id: bus.id },
          station: { id: this.mySalarie.station?.id }
        };
        this.http.put(`http://localhost:8081/Bus-tracking/salaries/update/${this.mySalarie.id}`, payload).subscribe({
          next: () => {
            this.selectedTragetId = trajet.id ?? null;
            this.selectedBusLabel = bus.designation;
            this.compatibleStations = [];
            this.mySalarie.bus = bus;
            this.selectionMsg = `✔ Trajet « ${trajet.libelle} » sélectionné → Bus « ${bus.designation} » assigné. Aucune station liée à ce trajet.`;
            this.selectionError = false;
          },
          error: () => {
            this.selectionMsg = 'Erreur lors de la mise à jour.';
            this.selectionError = true;
          }
        });
      }
    });
  }

  loadData() {
    this.tragetService.getAll().subscribe(data => {
      this.tragets = data;
      this.filteredTragets = data;
    });
  }

  openAddForm() {
    if (!this.auth.canCreate()) {
      return;
    }
    this.traget = {};
    this.isEdit = false;
    this.showEditor = true;
  }

  openEditForm(traget: Traget) {
    if (!this.auth.isAdmin()) {
      return;
    }
    this.traget = { ...traget };
    this.isEdit = true;
    this.showEditor = true;
  }

  closeEditor() {
    this.showEditor = false;
    this.reset();
  }

  save() {
    if (this.isEdit && !this.auth.isAdmin()) {
      return;
    }

    if (!this.isEdit && !this.auth.canCreate()) {
      return;
    }

    if (this.isEdit && this.traget.id) {
      this.tragetService.update(this.traget.id, this.traget).subscribe(() => {
        this.closeEditor();
        this.loadData();
      });
    } else {
      this.tragetService.add(this.traget).subscribe(() => {
        this.closeEditor();
        this.loadData();
      });
    }
  }

  delete(id: number) {
    if (!this.auth.canDelete()) {
      return;
    }

    this.tragetService.delete(id).subscribe(() => {
      this.pendingDeleteId = null;
      this.loadData();
    });
  }

  requestDelete(id: number): void {
    if (!this.auth.canDelete()) {
      return;
    }
    this.pendingDeleteId = id;
  }

  cancelDelete(): void {
    this.pendingDeleteId = null;
  }

  reset() {
    this.traget = {};
    this.isEdit = false;
  }

  applyFilter() {
    this.filteredTragets = this.tragets.filter(t =>
      (t.libelle || '').toLowerCase().includes(this.searchText.toLowerCase())
    );
  }
}