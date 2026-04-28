import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CountUp } from 'countup.js';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../core/auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('salariesCountRef', { static: false }) salariesCountRef!: ElementRef;
  @ViewChild('busCountRef', { static: false }) busCountRef!: ElementRef;
  @ViewChild('tragetsCountRef', { static: false }) tragetsCountRef!: ElementRef;

  salaries: any[] = [];
  Buses: any[] = [];
  Targets: any[] = [];

  private destroy$ = new Subject<void>();
  private salariesCountUp?: CountUp;
  private busCountUp?: CountUp;
  private tragetsCountUp?: CountUp;

  private readonly api = environment.apiUrl;

  constructor(private httpClient: HttpClient, public auth: AuthService) {}

  get ownSalarie(): any {
    if (this.auth.isAdmin()) return null;
    const username = (this.auth.currentUser?.username || '').toLowerCase();
    return this.salaries.find((s: any) =>
      (s.matricule || '').toLowerCase() === username
    ) || null;
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    forkJoin([
      this.httpClient.get<any>(`${this.api}/salaries/all`),
      this.httpClient.get<any>(`${this.api}/buses/getAll`),
      this.httpClient.get<any>(`${this.api}/tragets/getAll`)
    ]).pipe(takeUntil(this.destroy$)).subscribe(
      ([salariesData, busData, targetData]) => {
        this.salaries = salariesData;
        this.Buses = busData;
        this.Targets = targetData;
        this.mapTragetLabels();
        this.getCounts();
      },
      () => { /* erreur silencieuse en prod */ }
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getCounts() {
    this.httpClient.get<any>(`${this.api}/salaries/count`)
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.salariesCountUp = new CountUp(this.salariesCountRef.nativeElement, response);
        this.salariesCountUp.start();
      });

    this.httpClient.get<any>(`${this.api}/buses/count`)
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.busCountUp = new CountUp(this.busCountRef.nativeElement, response);
        this.busCountUp.start();
      });

    this.httpClient.get<any>(`${this.api}/tragets/count`)
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.tragetsCountUp = new CountUp(this.tragetsCountRef.nativeElement, response);
        this.tragetsCountUp.start();
      });
  }

  mapTragetLabels() {
    this.Buses = this.Buses.map((bus) => {
      const target = this.Targets.find((t) => t.id === bus.traget?.id);
      bus.tragetLabel = target ? target.libelle : 'N/A';
      const assignedCount = this.salaries
        .filter((salarie) => salarie.bus?.id === bus.id).length;
      bus.percentage = bus.capacite > 0 ? Math.min((assignedCount / bus.capacite) * 100, 100) : 0;
      return bus;
    });
  }
}
