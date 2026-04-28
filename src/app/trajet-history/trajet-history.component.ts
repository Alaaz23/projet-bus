import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-trajet-history',
  templateUrl: './trajet-history.component.html',
  styleUrls: ['./trajet-history.component.css']
})
export class TrajetHistoryComponent implements OnInit, OnDestroy {

  trajets: any[] = [];
  filteredTrajets: any[] = [];
  buses: any[] = [];
  loading = true;

  filterBusId: string = '';
  filterSearch: string = '';

  private destroy$ = new Subject<void>();
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient, public auth: AuthService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;
    this.http.get<any[]>(`${this.api}/trajets/history?limit=30`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.trajets = data;
          this.filteredTrajets = data;
          this.loading = false;
        },
        error: () => {
          this.trajets = [];
          this.filteredTrajets = [];
          this.loading = false;
        }
      });

    this.http.get<any[]>(`${this.api}/buses/getAll`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: (d) => this.buses = d, error: () => {} });
  }

  applyFilters(): void {
    this.filteredTrajets = this.trajets.filter(t => {
      const matchBus = !this.filterBusId || String(t.bus?.id) === this.filterBusId;
      const search = this.filterSearch.toLowerCase();
      const matchSearch = !search ||
        (t.salarie?.nom || '').toLowerCase().includes(search) ||
        (t.salarie?.prenom || '').toLowerCase().includes(search) ||
        (t.bus?.designation || '').toLowerCase().includes(search);
      return matchBus && matchSearch;
    });
  }

  exportCsv(): void {
    const headers = ['Date départ', 'Date arrivée', 'Bus', 'Salarié', 'Durée (min)', 'Distance (km)', 'Départ', 'Destination'];
    const rows = this.filteredTrajets.map(t => [
      t.dateDepart ? new Date(t.dateDepart).toLocaleString('fr-FR') : '',
      t.dateArrivee ? new Date(t.dateArrivee).toLocaleString('fr-FR') : '',
      t.bus?.designation || '',
      t.salarie ? `${t.salarie.nom} ${t.salarie.prenom}` : '',
      t.duree || '',
      t.distance || '',
      t.depart || '',
      t.destination || ''
    ]);
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historique_trajets_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  formatDuration(minutes: number): string {
    if (!minutes) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}min` : `${m} min`;
  }
}
