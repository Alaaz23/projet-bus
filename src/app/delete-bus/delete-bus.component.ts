import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-delete-bus',
  templateUrl: './delete-bus.component.html',
  styleUrls: ['./delete-bus.component.css']
})
export class DeleteBusComponent {
  id:  string = '';
  busList: any[] = [];

  constructor(private http: HttpClient) {}
  
  ngOnInit() {
    this.getAllBuses();
  }

  getAllBuses() {
    this.http.get<any[]>('http://localhost:8081/Bus-tracking/buses/getAll')
      .subscribe(
        response => {
          console.log('Buses récupérés avec succès', response);
          this.busList = response;
        },
        error => {
          console.error('Erreur lors de la récupération des bus', error);
        }
      );
  }

  
  onDelete() {
    if (!this.id) {
      console.error('No bus ID selected');
      return;
    }

    this.http.delete(`http://localhost:8081/Bus-tracking/buses/delete/${this.id}`)
      .subscribe(
        response => {
          console.log(response);
          this.getAllBuses();
        },
        error => {
          console.error('Erreur lors de la suppression du bus', error);
          this.getAllBuses();

        }
      );
  }
}
