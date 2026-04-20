import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CountUp } from 'countup.js';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('salariesCountRef', { static: false }) salariesCountRef!: ElementRef;
  @ViewChild('busCountRef', { static: false }) busCountRef!: ElementRef;
  @ViewChild('tragetsCountRef', { static: false }) tragetsCountRef!: ElementRef;

  salaries: any[] = [];
  Buses: any[] = [];
  Targets: any[] = [];



  private salariesCountUp?: CountUp;
  private busCountUp?: CountUp;
  private tragetsCountUp?: CountUp;

  constructor(private httpClient: HttpClient, public auth: AuthService) {}

  get ownSalarie(): any {
    if (this.auth.isAdmin()) return null;
    const username = (this.auth.currentUser?.username || '').toLowerCase();
    return this.salaries.find((s: any) =>
      (s.matricule || '').toLowerCase() === username
    ) || null;
  }

  ngOnInit(): void {
    // no-op
  }

  ngAfterViewInit(): void {
    forkJoin([
      this.httpClient.get<any>('http://localhost:8081/Bus-tracking/salaries/all'),
      this.httpClient.get<any>('http://localhost:8081/Bus-tracking/buses/getAll'),
      this.httpClient.get<any>('http://localhost:8081/Bus-tracking/tragets/getAll')
    ]).subscribe(
      ([salariesData, busData, targetData]) => {
        console.log('Salaries received:', salariesData);
        console.log('Buses received:', busData);
        console.log('Targets received:', targetData);
  
        // Update salaries, buses, and tragets arrays
        this.salaries = salariesData;
        this.Buses = busData;
        this.Targets = targetData;
  
        console.log('Fetched Buses:', this.Buses);
        this.mapTragetLabels();  // Call function to map traget labels
        this.getCounts();  // Call getCounts after the data is processed
      },
      (error) => {
        console.error('Error fetching data:', error);
      }
    );
  
  }
  
  getCounts() {
    this.httpClient.get<any>('http://localhost:8081/Bus-tracking/salaries/count').subscribe(
      (response) => {
        this.salariesCountUp = new CountUp(this.salariesCountRef.nativeElement, response);
        this.salariesCountUp.start();
      },
      (error) => {
        console.error('Error fetching salaries count:', error);
      }
    );

    this.httpClient.get<any>('http://localhost:8081/Bus-tracking/buses/count').subscribe((response) => {
      this.busCountUp = new CountUp(this.busCountRef.nativeElement, response);
      this.busCountUp.start();
    });

    this.httpClient.get<any>('http://localhost:8081/Bus-tracking/tragets/count').subscribe((response) => {
      this.tragetsCountUp = new CountUp(this.tragetsCountRef.nativeElement, response);
      this.tragetsCountUp.start();
    });
  }
  
  mapTragetLabels() {
    const busTotalCapacityMap = new Map<number, number>();

    // Map the traget labels to the buses
    this.Buses = this.Buses.map((bus) => {
      const target = this.Targets.find((t) => t.id === bus.traget.id);
      bus.tragetLabel = target ? target.libelle : 'Unknown traget';
  
      const totalCapacityForBus = this.salaries
      .filter((salarie) => salarie.bus.id === bus.id)
      .reduce((total, salarie) => total + salarie.bus.capacite, 0);

    // Calculate the percentage of capacity relative to the total capacity for the bus
    bus.percentage = totalCapacityForBus > 0 ? (totalCapacityForBus / bus.capacite) * 100 : 0;

    console.log(`Bus ID: ${bus.id}, Target ID_t: ${bus.id_t}, Target Label: ${bus.tragetLabel}, Percentage: ${bus.percentage}%`);

      return bus;
    });
  
    console.log('Mapped Traget Labels:', this.Buses);
  }
  
  
  
  
}
