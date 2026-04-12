import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-update-bus',
  templateUrl: './update-bus.component.html',
  styleUrls: ['./update-bus.component.css']
})
export class UpdateBusComponent {
  busList: any[] = [];
  designation: string = '';
  capacity: number | undefined;
  selectedBusId: string = '';
  selectedTraget: string = '';

  tragetList: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.getAllBuses();
    this.getAllTragets();
  }

  getAllBuses() {
    this.http.get<any[]>('http://localhost:8081/Bus-tracking/buses/getAll')
      .subscribe(
        response => {
          console.log('Buses retrieved successfully', response);
          this.busList = response;
        },
        error => {
          console.error('Error retrieving buses', error);
        }
      );
  }

  getAllTragets() {
    this.http.get<any[]>('http://localhost:8081/Bus-tracking/tragets/getAll')
      .subscribe(
        response => {
          console.log('Tragets retrieved successfully', response);
          this.tragetList = response;
        },
        error => {
          console.error('Error retrieving tragets', error);
        }
      );
  }

  onUpdate() {
    const updatedBus = {
      id: this.selectedBusId,
      designation: this.designation,
      capacite: this.capacity,
      traget: { id: this.selectedTraget }
    };

    this.http.put(`http://localhost:8081/Bus-tracking/buses/update/${this.selectedBusId}`, updatedBus)
      .subscribe(
        response => {
          console.log('Bus updated successfully', response);
        },
        error => {
          console.error('Error updating bus', error);
        }
      );
  }

  onSelectBus() {
    if (this.selectedBusId) {
      this.http.get<any>(`http://localhost:8081/Bus-tracking/buses/${this.selectedBusId}`)
        .subscribe(
          response => {
            console.log('Details of the selected Bus', response);
            this.designation = response.designation;
            this.capacity = response.capacite;
            this.selectedTraget = response.traget.id;
          },
          error => {
            console.error('Error retrieving details of the bus', error);
          }
        );
    }
  }
}
