import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../core/auth.service';
import { environment } from '../../environments/environment';

interface SalariePayload {
  id?: number;
  matricule: string;
  password?: string;
  nom: string;
  prenom: string;
  bus: { id: string };
  station: { id: string };
}

@Component({
  selector: 'app-salarie-management',
  templateUrl: './salarie-management.component.html',
  styleUrls: ['./salarie-management.component.css']
})
export class SalarieManagementComponent implements OnInit {
  salaries: any[] = [];
  buses: any[] = [];
  stations: any[] = [];
  searchText = '';

  editorOpen = false;
  isEdit = false;
  error = '';
  success = '';
  pendingDeleteId: number | null = null;

  pwModalOpen = false;
  newPw = '';
  confirmPw = '';
  pwError = '';
  pwSuc = '';
  salarieForPw: any = null;

  formModel: SalariePayload = this.emptyForm();

  constructor(private http: HttpClient, public auth: AuthService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    const api = environment.apiUrl;
    this.http.get<any[]>(`${api}/salaries/all`).subscribe((res) => (this.salaries = res || []));
    this.http.get<any[]>(`${api}/buses/getAll`).subscribe((res) => (this.buses = res || []));
    this.http.get<any[]>(`${api}/stations/all`).subscribe((res) => (this.stations = res || []));
  }

  get filteredSalaries(): any[] {
    // USER ne voit que son propre enregistrement
    let list = this.salaries;
    if (!this.auth.isAdmin()) {
      list = list.filter((s) =>
        (s.matricule || '').toLowerCase() === (this.auth.currentUser?.username || '').toLowerCase()
      );
    }

    if (!this.searchText.trim()) {
      return list;
    }

    const term = this.searchText.toLowerCase();
    return list.filter((s) =>
      `${s.matricule} ${s.nom} ${s.prenom}`.toLowerCase().includes(term)
    );
  }

  openCreate(): void {
    if (!this.auth.canCreate()) {
      return;
    }

    this.clearMessages();
    this.isEdit = false;
    this.formModel = this.emptyForm();
    this.editorOpen = true;
  }

  openEdit(salarie: any): void {
    if (!this.auth.canEditSalarie(salarie.matricule)) {
      return;
    }

    this.clearMessages();
    this.isEdit = true;
    this.editorOpen = true;
    this.formModel = {
      id: salarie.id,
      matricule: salarie.matricule,
      password: '',
      nom: salarie.nom,
      prenom: salarie.prenom,
      bus: { id: String(salarie.bus?.id ?? '') },
      station: { id: String(salarie.station?.id ?? '') }
    };
  }

  closeEditor(): void {
    this.editorOpen = false;
    this.formModel = this.emptyForm();
    this.error = '';
  }

  save(): void {
    this.clearMessages();

    if (this.isEdit && !this.auth.canEditSalarie(this.formModel.matricule)) {
      this.error = 'Vous n avez pas les droits pour modifier.';
      return;
    }

    if (!this.isEdit && !this.auth.canCreate()) {
      this.error = 'Vous n avez pas les droits pour ajouter.';
      return;
    }

    if (!this.formModel.matricule || !this.formModel.nom || !this.formModel.prenom || !this.formModel.bus.id || !this.formModel.station.id) {
      this.error = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }

    if (!this.isEdit && !this.formModel.password) {
      this.error = 'Le mot de passe est obligatoire lors de la création d’un salarié.';
      return;
    }

    const payload: any = {
      matricule: this.formModel.matricule,
      nom: this.formModel.nom,
      prenom: this.formModel.prenom,
      bus: { id: this.formModel.bus.id },
      station: { id: this.formModel.station.id }
    };

    if (this.auth.isAdmin() && this.formModel.password) {
      payload.password = this.formModel.password;
    }

    if (this.isEdit && this.formModel.id) {
      this.http
        .put(`${environment.apiUrl}/salaries/update/${this.formModel.id}`, payload)
        .subscribe({
          next: () => {
            this.success = 'Salarié modifié avec succès.';
            this.editorOpen = false;
            this.loadAll();
          },
          error: () => (this.error = 'Echec de la mise à jour.')
        });
      return;
    }

    this.http.post(`${environment.apiUrl}/salaries/add`, { ...payload, password: this.formModel.password }).subscribe({
      next: () => {
        this.success = 'Salarié ajouté avec succès.';
        this.editorOpen = false;
        this.loadAll();
      },
      error: () => (this.error = 'Echec de la création.')
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

  confirmDelete(salarie: any): void {
    if (!this.auth.canDelete()) {
      this.error = 'Vous n avez pas les droits pour supprimer.';
      return;
    }

    this.clearMessages();
    this.http
      .delete(`${environment.apiUrl}/salaries/delete/${salarie.id}`, { params: { matricule: salarie.matricule } })
      .subscribe({
        next: () => {
          this.pendingDeleteId = null;
          this.success = 'Salarié supprimé.';
          this.loadAll();
        },
        error: () => (this.error = 'Echec de la suppression.')
      });
  }

  openPwModal(salarie: any): void {
    if (!this.auth.canEditSalarie(salarie.matricule)) return;
    this.salarieForPw = salarie;
    this.newPw = '';
    this.confirmPw = '';
    this.pwError = '';
    this.pwSuc = '';
    this.pwModalOpen = true;
  }

  savePw(): void {
    if (!this.newPw || this.newPw.length < 4) {
      this.pwError = 'Le mot de passe doit contenir au moins 4 caractères.';
      return;
    }
    if (this.newPw !== this.confirmPw) {
      this.pwError = 'Les mots de passe ne correspondent pas.';
      return;
    }
    const s = this.salarieForPw;
    const payload: any = {
      matricule: s.matricule,
      nom: s.nom,
      prenom: s.prenom,
      password: this.newPw,
      bus: { id: String(s.bus?.id ?? '') },
      station: { id: String(s.station?.id ?? '') }
    };
    this.http.put(`${environment.apiUrl}/salaries/update/${s.id}`, payload).subscribe({
      next: () => {
        this.pwSuc = 'Mot de passe mis à jour avec succès.';
        this.pwError = '';
        setTimeout(() => { this.pwModalOpen = false; this.pwSuc = ''; }, 2000);
      },
      error: () => (this.pwError = 'Erreur lors de la mise à jour.')
    });
  }

  private emptyForm(): SalariePayload {
    return {
      matricule: '',
      password: '',
      nom: '',
      prenom: '',
      bus: { id: '' },
      station: { id: '' }
    };
  }

  private clearMessages(): void {
    this.error = '';
    this.success = '';
  }
}
