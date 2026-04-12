import {Component, OnInit} from '@angular/core';
import { StationService } from '../Services/station.service';
import { TragetService } from '../Services/traget.service';
import {Station} from "../Model/station";
import {Traget} from "../Model/Target";
// Removed NgbModal import (not used) to avoid requiring @ng-bootstrap/ng-bootstrap
import { ToastrService } from 'ngx-toastr';



import { CommonModule } from '@angular/common';   // ✅
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ToolbarModule } from 'primeng/toolbar';

import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-station',
  standalone: true,
  imports: [
    CommonModule,   // ✅ pour *ngFor
    FormsModule,    // ✅ pour ngModel
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    ToolbarModule,
    
    ConfirmDialogModule
  ],
  templateUrl: './station.component.html',
  styleUrl: './station.component.css',
  providers: [ConfirmationService] // ✅ AJOUT ICI
})
export class StationComponent {

  stations: Station[] = [];
  tragets: Traget[] = [];
  currentStation: Station = new Station();
  editMode: boolean = false;
  showDialog: boolean = false;
  globalFilter: string = '';

  constructor(
    private stationService: StationService,
    private tragetService: TragetService,
    private toastr: ToastrService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadStations();
    this.loadTragets();
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

  openAddModal() {
    this.editMode = false;
    this.currentStation = new Station();
    this.showDialog = true;
  }

  openEditModal(station: Station) {
    this.editMode = true;
    this.currentStation = { ...station };
    this.showDialog = true;
  }

  saveStation() {
    if (this.editMode) {
      this.stationService.updateStation(this.currentStation.id!, this.currentStation)
        .subscribe(() => {
          this.loadStations();
          this.toastr.success('Station modifiée avec succès', 'Succès');
        });
    } else {
      // Prevent sending an id when creating a new station (avoids duplicate-pkey DB errors)
      const payload: any = { ...this.currentStation };
      if ('id' in payload) delete payload.id;

      this.stationService.addStation(payload).subscribe(() => {
        this.loadStations();
        this.toastr.success('Station ajoutée avec succès', 'Succès');
        this.showDialog = false;
      }, err => {
        console.error('addStation error', err);
        const msg = err?.error?.message || 'Erreur lors de l\'ajout de la station';
        this.toastr.error(msg, 'Erreur');
      });
    }
  }

  deleteStation(id: number) {
    this.confirmationService.confirm({
      message: 'Voulez-vous vraiment supprimer cette station ?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.stationService.deleteStation(id).subscribe(() => {
          this.loadStations();
          this.toastr.info('Station supprimée', 'Suppression');
        }, err => {
          console.error('deleteStation error', err);
          this.toastr.error('Erreur lors de la suppression', 'Erreur');
        });
      },
      reject: () => {
        // user cancelled
      }
    });
  }
}

