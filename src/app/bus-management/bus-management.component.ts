import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../core/auth.service';
import { environment } from '../../environments/environment';

interface TragetItem {
  id: number;
  libelle: string;
}

interface BusItem {
  id?: number;
  designation: string;
  capacite: number | null;
  traget?: TragetItem;
  statut?: string;
}

@Component({
  selector: 'app-bus-management',
  templateUrl: './bus-management.component.html',
  styleUrls: ['./bus-management.component.css']
})
export class BusManagementComponent implements OnInit {
  buses: BusItem[] = [];
  filteredBuses: BusItem[] = [];
  tragets: TragetItem[] = [];

  searchText = '';
  showEditor = false;
  editMode = false;
  pendingDeleteId: number | null = null;

  currentBus: BusItem = { designation: '', capacite: null };
  selectedTragetId = '';

  private readonly busesApi = `${environment.apiUrl}/buses`;
  private readonly tragetsApi = `${environment.apiUrl}/tragets/getAll`;

  constructor(private http: HttpClient, public auth: AuthService) {}

  ngOnInit(): void {
    this.loadBuses();
    this.loadTragets();
  }

  loadBuses(): void {
    this.http.get<BusItem[]>(`${this.busesApi}/getAll`).subscribe({
      next: (data) => {
        this.buses = data || [];
        this.applyFilter();
      },
      error: () => {
        this.buses = [];
        this.applyFilter();
      }
    });
  }

  loadTragets(): void {
    this.http.get<TragetItem[]>(this.tragetsApi).subscribe({
      next: (data) => {
        this.tragets = data || [];
      },
      error: () => {
        this.tragets = [];
      }
    });
  }

  applyFilter(): void {
    const term = this.searchText.trim().toLowerCase();
    if (!term) {
      this.filteredBuses = [...this.buses];
      return;
    }

    this.filteredBuses = this.buses.filter((bus) => {
      const byId = String(bus.id || '').includes(term);
      const byDesignation = (bus.designation || '').toLowerCase().includes(term);
      const byCapacite = String(bus.capacite || '').includes(term);
      const byTraget = (bus.traget?.libelle || '').toLowerCase().includes(term);
      return byId || byDesignation || byCapacite || byTraget;
    });
  }

  openAddForm(): void {
    this.editMode = false;
    this.currentBus = { designation: '', capacite: null };
    this.selectedTragetId = '';
    this.showEditor = true;
  }

  openEditForm(bus: BusItem): void {
    this.editMode = true;
    this.currentBus = {
      id: bus.id,
      designation: bus.designation,
      capacite: bus.capacite ?? null,
      traget: bus.traget
    };
    this.selectedTragetId = bus.traget?.id ? String(bus.traget.id) : '';
    this.showEditor = true;
  }

  closeEditor(): void {
    this.showEditor = false;
  }

  saveBus(): void {
    if (!this.selectedTragetId) {
      return;
    }

    const payload = {
      designation: this.currentBus.designation,
      capacite: this.currentBus.capacite,
      traget: { id: Number(this.selectedTragetId) }
    };

    if (this.editMode && this.currentBus.id) {
      this.http.put(`${this.busesApi}/update/${this.currentBus.id}`, { ...payload, id: this.currentBus.id }).subscribe({
        next: () => {
          this.closeEditor();
          this.loadBuses();
        }
      });
      return;
    }

    this.http.post(`${this.busesApi}/add`, payload).subscribe({
      next: () => {
        this.closeEditor();
        this.loadBuses();
      }
    });
  }

  requestDelete(id: number): void {
    this.pendingDeleteId = id;
  }

  cancelDelete(): void {
    this.pendingDeleteId = null;
  }

  deleteBus(id: number): void {
    this.http.delete(`${this.busesApi}/delete/${id}`).subscribe({
      next: () => {
        this.pendingDeleteId = null;
        this.loadBuses();
      },
      error: () => {
        this.pendingDeleteId = null;
      }
    });
  }
}
