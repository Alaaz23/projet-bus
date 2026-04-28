import {Component, OnInit} from '@angular/core';
import { StationService } from '../Services/station.service';
import { TragetService } from '../Services/traget.service';
import {Station} from "../Model/station";
import {Traget} from "../Model/Target";
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../core/auth.service';

import { CommonModule } from '@angular/common';   // ✅
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-station',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './station.component.html',
  styleUrl: './station.component.css'
})
export class StationComponent {

  stations: Station[] = [];
  tragets: Traget[] = [];
  currentStation: Station = new Station();
  editMode: boolean = false;
  showEditor: boolean = false;
  searchText: string = '';
  pendingDeleteId: number | null = null;

  mySalarie: any = null;
  allBuses: any[] = [];
  selectedStationId: number | null = null;
  selectedTragetId: number | null = null;
  selectionMsg = '';
  selectionError = false;
  selectionLoading = false;

  /** True quand le trajet sélectionné n'a aucune station dans la liste chargée */
  get trajetHasNoStations(): boolean {
    if (!this.selectedTragetId || this.auth.isAdmin()) return false;
    return !this.stations.some((s: Station) => s.traget?.id === this.selectedTragetId);
  }

  constructor(
    private stationService: StationService,
    private tragetService: TragetService,
    private toastr: ToastrService,
    public auth: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadStations();
    this.loadTragets();
    if (!this.auth.isAdmin()) {
      this.loadMySalarie();
      this.loadAllBuses();
    }
  }

  loadAllBuses(): void {
    this.http.get<any[]>('http://localhost:8081/Bus-tracking/buses/getAll').subscribe({
      next: (res) => (this.allBuses = res || [])
    });
  }

  loadMySalarie(): void {
    const username = (this.auth.currentUser?.username || '').toLowerCase();
    this.http.get<any[]>('http://localhost:8081/Bus-tracking/salaries/all').subscribe({
      next: (res) => {
        this.mySalarie = (res || []).find((s: any) =>
          (s.matricule || '').toLowerCase() === username
        ) || null;
        if (this.mySalarie) {
          this.selectedStationId = this.mySalarie.station?.id ?? null;
          this.selectedTragetId = this.mySalarie.bus?.traget?.id ?? null;
        }
      }
    });
  }

  selectStation(station: Station): void {
    if (!this.mySalarie) return;

    const trajetId = station.traget?.id ?? null;

    if (!trajetId) {
      // Station non liée à un trajet : refuser la sélection
      this.selectionMsg = `⚠ La station « ${station.libelle} » n’est liée à aucun trajet. Sélection impossible.`;
      this.selectionError = true;
      return;
    }

    // Trouver le bus lié à ce trajet
    const bus = this.allBuses.find((b: any) => b.traget?.id === trajetId);
    if (!bus) {
      this.selectionMsg = `⚠ Aucun bus disponible pour le trajet de cette station. Sélection impossible.`;
      this.selectionError = true;
      return;
    }

    this.selectionLoading = true;
    const payload = {
      matricule: this.mySalarie.matricule,
      nom: this.mySalarie.nom,
      prenom: this.mySalarie.prenom,
      bus: { id: bus.id },
      station: { id: station.id }
    };
    this.http.put(`http://localhost:8081/Bus-tracking/salaries/update/${this.mySalarie.id}`, payload).subscribe({
      next: () => {
        this.selectionLoading = false;
        this.selectedStationId = station.id ?? null;
        this.selectedTragetId = trajetId;
        this.mySalarie.station = station;
        this.mySalarie.bus = bus;
        const trajetLabel = station.traget?.libelle ?? 'inconnu';
        this.selectionMsg = `✔ Station « ${station.libelle} » sélectionnée → Trajet « ${trajetLabel} » + Bus « ${bus.designation} » mis à jour automatiquement.`;
        this.selectionError = false;
      },
      error: () => {
        this.selectionLoading = false;
        this.selectionMsg = 'Erreur lors de la mise à jour.';
        this.selectionError = true;
      }
    });
  }

  loadStations() {
    this.stationService.getAllStations().subscribe(data => {
      console.log('Loaded stations (raw):', data);
      // Normalize station objects to tolerant property names from backend
      this.stations = (data || []).map((raw: any) => this.normalizeStation(raw));
      console.log('Loaded stations (normalized):', this.stations);
    }, err => console.error('loadStations error', err));
  }

  private normalizeStation(raw: any): Station {
    const s = new Station();
    s.id = raw.id ?? raw.ID ?? raw.stationId;
    s.libelle = raw.libelle ?? raw.name ?? raw.label ?? '';
    s.longitude = raw.longitude ?? raw.long ?? raw.lng ?? raw.lon ?? raw.x ?? null;
    s.latitude = raw.latitude ?? raw.lat ?? raw.y ?? null;
    // traget/target handling
    const rawTarget = raw.traget ?? raw.target ?? raw.tragetId ?? raw.trajet ?? raw.tragetObj ?? null;
    if (rawTarget) {
      if (typeof rawTarget === 'string') {
        s.traget = { libelle: rawTarget } as any;
      } else if (rawTarget.libelle || rawTarget.name) {
        s.traget = { id: rawTarget.id, libelle: rawTarget.libelle ?? rawTarget.name } as any;
      } else if (typeof rawTarget === 'number') {
        s.traget = { id: rawTarget, libelle: '' } as any;
      }
    }
    return s;
  }

  loadTragets() {
    this.tragetService.getAllTragets().subscribe(data => this.tragets = data);
  }

  get filteredStations(): Station[] {
    if (!this.searchText.trim()) {
      return this.stations;
    }

    const term = this.searchText.toLowerCase();
    return this.stations.filter((s) =>
      `${s.libelle} ${s.traget?.libelle ?? ''}`.toLowerCase().includes(term)
    );
  }

  openAddForm() {
    if (!this.auth.canCreate()) {
      return;
    }

    this.editMode = false;
    this.currentStation = new Station();
    this.showEditor = true;
  }

  openEditForm(station: Station) {
    if (!this.auth.isAdmin()) {
      return;
    }

    this.editMode = true;
    this.currentStation = { ...station };
    this.showEditor = true;
  }

  closeEditor(): void {
    this.showEditor = false;
    this.currentStation = new Station();
  }

  saveStation() {
    if (this.editMode && !this.auth.canEdit()) {
      this.toastr.error('Action non autorisee', 'Permission');
      return;
    }

    if (!this.editMode && !this.auth.canCreate()) {
      this.toastr.error('Action non autorisee', 'Permission');
      return;
    }

    if (this.editMode) {
      this.stationService.updateStation(this.currentStation.id!, this.currentStation)
        .subscribe(() => {
          this.loadStations();
          this.toastr.success('Station modifiée avec succès', 'Succès');
          this.showEditor = false;
        });
    } else {
      const payload: any = { ...this.currentStation };
      if ('id' in payload) delete payload.id;

      this.stationService.addStation(payload).subscribe(() => {
        this.loadStations();
        this.toastr.success('Station ajoutée avec succès', 'Succès');
        this.showEditor = false;
      }, err => {
        console.error('addStation error', err);
        const msg = err?.error?.message || 'Erreur lors de l\'ajout de la station';
        this.toastr.error(msg, 'Erreur');
      });
    }
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

  deleteStation(id: number) {
    if (!this.auth.canDelete()) {
      this.toastr.error('Action non autorisee', 'Permission');
      return;
    }

    this.stationService.deleteStation(id).subscribe(() => {
      this.loadStations();
      this.pendingDeleteId = null;
      this.toastr.info('Station supprimée', 'Suppression');
    }, err => {
      console.error('deleteStation error', err);
      this.toastr.error('Erreur lors de la suppression', 'Erreur');
    });
  }
}

