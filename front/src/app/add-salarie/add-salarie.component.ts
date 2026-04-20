import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-add-salarie',
  templateUrl: './add-salarie.component.html',
  styleUrls: ['./add-salarie.component.css']
})
export class AddSalarieComponent implements OnInit {
  matricule: string | undefined;
  password: string | undefined;
  nom: string | undefined;
  prenom: string | undefined;
  confirmPassword: string | undefined;
  busList: any[] = [];
  selectedBus: string = '';
  stationList: any[] = [];
  selectedStation: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.getAllBuses();
    this.getAllStations();
  }

  getAllBuses() {
    this.http.get<any[]>('http://localhost:8081/Bus-tracking/buses/getAll')
    .subscribe(
        response => {
          console.log('Buses récupérés avec succès', response);
          this.busList = response;
        },
        (error: HttpErrorResponse) => {
          console.error('Erreur lors de la récupération des bus', error);
          console.log('Error status:', error.status);
          console.log('Error message:', error.message);
          console.log('Response headers:', error.headers);
        }
      );
  }

  getAllStations() {
    this.http.get<any[]>('http://localhost:8081/Bus-tracking/stations/all')
    .subscribe(
        response => {
          console.log('Stations retrieved successfully', response);
          this.stationList = response;
        },
        (error: HttpErrorResponse) => {
          console.error('Error fetching stations', error);
          console.log('Error status:', error.status);
          console.log('Error message:', error.message);
          console.log('Response headers:', error.headers);
        }
      );
  }

  onSubmit() {
    // Ensure the selectedBus is a number before sending the request
 
  
    const selectedStationObject = this.stationList.find(station => station.libelle === this.selectedStation);
  
    if (!selectedStationObject) {
      console.error('Invalid station selection.');
      return;
    }
  
    const salaryData = {
      matricule: this.matricule,
      password: this.password,
      nom:this.nom,
      prenom:this.prenom,
      bus: { id: this.selectedBus },
      station: { id: selectedStationObject.id }
    };
  
    console.log(salaryData);
  
    this.http.post('http://localhost:8081/Bus-tracking/salaries/add', salaryData)
      .subscribe(
        (response: any) => {
          if (response.status === 200) {
            console.log('Salarie added successfully');
          } else {
            console.error('Erreur lors de l\'ajout du salarie', response);
            console.log('Error status:', response.status);
            console.log('Error message:', response.message);
            console.log('Response headers:', response.headers);
          }
        },
        
      );
  }
  
  
  
  

  // Your Angular component
  isPasswordVisible = false;

  onPasswordInput(event: any): void {
    this.isPasswordVisible = event.target.value.length > 0;
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;

    const passwordInput = document.getElementById('password') as HTMLInputElement;
    passwordInput.type = this.isPasswordVisible ? 'text' : 'password';
  }
}
