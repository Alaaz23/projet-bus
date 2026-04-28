import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/auth.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('busStatutChart') busStatutChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('feedbackChart') feedbackChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trajetsChart') trajetsChartRef!: ElementRef<HTMLCanvasElement>;

  stats: any = {};
  loading = true;
  exporting = false;
  exportMsg = '';

  private destroy$ = new Subject<void>();
  private charts: Chart[] = [];
  private refreshInterval: any;

  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient, public auth: AuthService) {}

  ngOnInit(): void {
    this.loadStats();
    this.refreshInterval = setInterval(() => this.loadStats(), 30000);
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearInterval(this.refreshInterval);
    this.charts.forEach(c => c.destroy());
  }

  loadStats(): void {
    this.http.get<any>(`${this.api}/admin/statistics`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.stats = data;
          this.loading = false;
          setTimeout(() => this.renderCharts(), 100);
        },
        error: () => { this.loading = false; }
      });
  }

  renderCharts(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    // Chart 1 : Bus par statut (Doughnut)
    if (this.busStatutChartRef?.nativeElement && this.stats.busParStatut) {
      const d = this.stats.busParStatut;
      const c = new Chart(this.busStatutChartRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['En Route', 'À l\'arrêt', 'Hors Service'],
          datasets: [{
            data: [d.EN_ROUTE || 0, d.A_LARRET || 0, d.HORS_SERVICE || 0],
            backgroundColor: ['#4CAF50', '#FF9800', '#F44336'],
            borderWidth: 2
          }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
      });
      this.charts.push(c);
    }

    // Chart 2 : Feedbacks lus/non lus (Pie)
    if (this.feedbackChartRef?.nativeElement && this.stats.feedbackStatus) {
      const d = this.stats.feedbackStatus;
      const c = new Chart(this.feedbackChartRef.nativeElement, {
        type: 'pie',
        data: {
          labels: ['Lus', 'Non lus'],
          datasets: [{
            data: [d.lus || 0, d.nonLus || 0],
            backgroundColor: ['#2196F3', '#FF5722'],
            borderWidth: 2
          }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
      });
      this.charts.push(c);
    }

    // Chart 3 : Trajets 7 derniers jours (Line)
    if (this.trajetsChartRef?.nativeElement && this.stats.trajetsSemaine) {
      const labels = this.stats.trajetsSemaine.map((t: any) => t.date);
      const data = this.stats.trajetsSemaine.map((t: any) => t.trajets);
      const c = new Chart(this.trajetsChartRef.nativeElement, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Trajets actifs',
            data,
            borderColor: '#2196F3',
            backgroundColor: 'rgba(33,150,243,0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#2196F3'
          }]
        },
        options: {
          responsive: true,
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
          plugins: { legend: { display: false } }
        }
      });
      this.charts.push(c);
    }
  }

  // ─── Export PDF ────────────────────────────────────────────────────────────

  exportPdf(type: string): void {
    this.exporting = true;
    this.exportMsg = '';
    this.http.get(`${this.api}/admin/export/${type}`, { responseType: 'blob' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${type}_${new Date().toISOString().split('T')[0]}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
          this.exporting = false;
          this.exportMsg = 'PDF téléchargé avec succès !';
          setTimeout(() => this.exportMsg = '', 3000);
        },
        error: () => {
          this.exporting = false;
          this.exportMsg = 'Erreur lors de l\'export.';
        }
      });
  }
}
