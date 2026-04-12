import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-add-bus',
  templateUrl: './add-bus.component.html',
  styleUrls: ['./add-bus.component.css']
})
export class AddBusComponent {
  capacity: number | undefined;
  designation: string | undefined;
  selectedTraget:  string = ''; 
  tragetList: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.getAllTragets();
  }

  getAllTragets() {
    this.http.get<any[]>('http://localhost:8081/Bus-tracking/tragets/getAll')
      .subscribe(
        response => {
          console.log('Im here');
          console.log('Tragets récupérés avec succès', response);
          this.tragetList = response;
        },
        error => {
          console.error('Erreur lors de la récupération des tragets', error);
        }
      );
  }

  onSubmit() {
    const selectedStragetObject = this.tragetList.find(traget => traget.libelle === this.selectedTraget);

    const busData = {
      capacite: this.capacity,
      designation: this.designation,
      traget: { id: selectedStragetObject.id },
    };

    this.http.post('http://localhost:8081/Bus-tracking/buses/add', busData)
      .subscribe(
        response => {
          console.log('Bus added successfully', response);
          // Reset form fields after successful submission
          this.capacity = undefined;
          this.designation = undefined;
          this.selectedTraget = '';
                },
        error => {
          console.error('Error adding bus', error);
        }
      );
  }
}
