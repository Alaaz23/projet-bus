import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-update-salarie',
  templateUrl: './update-salarie.component.html',
  styleUrls: ['./update-salarie.component.css']
})
export class UpdateSalarieComponent {
  salarieList: any[] = [];
  matricule: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  selectedSalarieId: string = '';
  selectedBus: string = '';
  selectedStation: string = '';
  busList: any[] = [];
  stationList: any[] = [];
  isPasswordVisible = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.getAllSalaries();
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
        error => {
          console.error('Erreur lors de la récupération des bus', error);
        }
      );
  }

  getAllSalaries() {
    this.http.get<any[]>('http://localhost:8081/Bus-tracking/salaries/all')
      .subscribe(
        response => {
          console.log('Salaries récupérés avec succès', response);
          this.salarieList = response;
        },
        error => {
          console.error('Erreur lors de la récupération des salariés', error);
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
        error => {
          console.error('Erreur lors de la récupération des stations', error);
        }
      );
  }

  onUpdate() {
   // if (!this.matricule || !this.newPassword || !this.confirmPassword || !this.selectedSalarieId || !this.selectedBus || !this.selectedStation) {
    //  console.error('Tous les champs doivent être remplis.');
      //return;
    //}

    // Prepare the updated Salarie object
    const updatedSalarie = {
      id: this.selectedSalarieId,
      matricule: this.matricule,
      password: this.newPassword,
      bus: { id: this.selectedBus }, // Assuming bus has an 'id' property
      station: { libelle: this.selectedStation } // Assuming station has a 'libelle' property
    };

    // Send the update request
    this.http.put(`http://localhost:8081/Bus-tracking/salaries/update/${this.selectedSalarieId}`, updatedSalarie)
      .subscribe(
        response => {
          console.log('Salarié mis à jour avec succès', response);
          // Optionally, you can reset the form or perform other actions after a successful update
        },
        error => {
          console.error('Erreur lors de la mise à jour du salarié', error);
        }
      );
  }

  onPasswordInput(event: any): void {
    this.isPasswordVisible = event.target.value.length > 0;
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;

    const passwordInput = document.getElementById('password') as HTMLInputElement;
    passwordInput.type = this.isPasswordVisible ? 'text' : 'password';
  }

  onSelectSalarie(): void {
    if (this.selectedSalarieId) {
      this.http.get<any>(`http://localhost:8081/Bus-tracking/salaries/${this.selectedSalarieId}`)
        .subscribe(
          response => {
            console.log('Details of the selected Salarie', response);
            this.matricule = response.matricule;
            this.newPassword = response.password;
            this.selectedBus = response.bus.id;
            this.selectedStation = response.station.libelle;
          },
          error => {
            console.error('Erreur lors de la récupération des détails du salarié', error);
          }
        );
    }
  }
}
