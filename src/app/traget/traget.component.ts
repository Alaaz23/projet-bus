import { Component, OnInit } from '@angular/core';
import { Traget } from '../Model/Target';
import { TragetService } from '../Services/traget.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-traget',
  templateUrl: './traget.component.html'
})
export class TragetComponent implements OnInit {

  tragets: Traget[] = [];
  filteredTragets: Traget[] = [];

  traget: Traget = {};
  searchText: string = '';
  isEdit = false;

  constructor(private tragetService: TragetService , private confirmationService: ConfirmationService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.tragetService.getAll().subscribe(data => {
      this.tragets = data;
      this.filteredTragets = data;
    });
  }

  save() {
    if (this.isEdit && this.traget.id) {
      this.tragetService.update(this.traget.id, this.traget).subscribe(() => {
        this.reset();
        this.loadData();
      });
    } else {
      this.tragetService.add(this.traget).subscribe(() => {
        this.reset();
        this.loadData();
      });
    }
  }

  edit(traget: Traget) {
    this.traget = { ...traget };
    this.isEdit = true;
  }

  delete(id: number) {
    if (confirm('Supprimer ce traget ?')) {
      this.tragetService.delete(id).subscribe(() => {
        this.loadData();
      });
    }
  }
   confirmDelete(id: number) {
    this.confirmationService.confirm({
      message: 'Voulez-vous vraiment supprimer ce trage ?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',

      accept: () => {
        this.delete(id);
      }
    });
  }

  reset() {
    this.traget = {};
    this.isEdit = false;
  }

 search() {
  this.filteredTragets = this.tragets.filter(t =>
    (t.libelle || '').toLowerCase().includes(this.searchText.toLowerCase())
  );
}



}