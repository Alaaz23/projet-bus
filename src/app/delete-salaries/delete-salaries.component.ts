import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-delete-salaries',
  templateUrl: './delete-salaries.component.html',
  styleUrls: ['./delete-salaries.component.css']
})
export class DeleteSalariesComponent {
  id:  string = '';
  matricule: string = '';
  salarieList: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.getAllSalaries();
  }

  getAllSalaries() {
    this.http.get<any[]>('http://localhost:8081/Bus-tracking/salaries/all')
      .subscribe(
        response => {
          console.log('Salaries retrieved successfully', response);
          this.salarieList = response;
        },
        error => {
          console.error('Error retrieving salaries', error);
        }
      );
  }

  onDelete() {
    const requestBody = {
      id: this.id,
      matricule: this.matricule
        };

    this.http.delete(`http://localhost:8081/Bus-tracking/salaries/delete/${this.id}`, { params: { matricule: this.matricule } })
      .subscribe(
        response => {
          console.log('Salarie deleted successfully', response);
          this.getAllSalaries();
        },
        error => {
          console.error('Error deleting salarie', error);
        }
      );
  }
}
