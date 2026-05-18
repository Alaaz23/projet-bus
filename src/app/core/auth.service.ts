import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthUser, UserRole } from './auth.types';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'busTracking.auth';
  private readonly refreshKey = 'busTracking.refreshToken';
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  readonly currentUser$ = new BehaviorSubject<AuthUser | null>(this.readStoredUser());

  get currentUser(): AuthUser | null {
    return this.currentUser$.value;
  }

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return new Observable((observer) => {
      this.http
        .post(`${this.apiUrl}/login`, { matricule: username, password })
        .subscribe({
          next: (response: any) => {
            if (response.success) {
              const authUser: AuthUser = {
                username: response.username,
                role: (response.role || 'USER') as UserRole,
                displayName: response.displayName,
                token: response.token,
                busId: response.busId ?? null,
              };

              localStorage.setItem(this.storageKey, JSON.stringify(authUser));
              if (response.refreshToken) {
                localStorage.setItem(this.refreshKey, response.refreshToken);
              }
              this.currentUser$.next(authUser);
            }

            observer.next(response);
            observer.complete();
          },
          error: (err) => {
            observer.next({ success: false, message: 'Connexion impossible au serveur. Vérifiez que le backend est démarré.' });
            observer.complete();
          }
        });
    });
  }

  /** Rafraîchit l'access token via le refresh token stocké */
  refreshAccessToken(): Observable<boolean> {
    return new Observable((observer) => {
      const refreshToken = localStorage.getItem(this.refreshKey);
      if (!refreshToken) {
        observer.next(false);
        observer.complete();
        return;
      }

      this.http.post(`${this.apiUrl}/refresh`, { refreshToken }).subscribe({
        next: (response: any) => {
          if (response.success && response.token) {
            // Mettre à jour l'access token
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
              const authUser: AuthUser = { ...JSON.parse(stored), token: response.token };
              localStorage.setItem(this.storageKey, JSON.stringify(authUser));
              this.currentUser$.next(authUser);
            }
            if (response.refreshToken) {
              localStorage.setItem(this.refreshKey, response.refreshToken);
            }
            observer.next(true);
          } else {
            observer.next(false);
          }
          observer.complete();
        },
        error: () => {
          observer.next(false);
          observer.complete();
        }
      });
    });
  }

  logout(): void {
    const refreshToken = localStorage.getItem(this.refreshKey);
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/logout`, { refreshToken }).subscribe();
    }
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.refreshKey);
    this.currentUser$.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const current = this.currentUser;
    return !!current && roles.includes(current.role);
  }

  isAdmin(): boolean {
    return this.hasAnyRole(['ADMIN']);
  }

  canDelete(): boolean {
    return this.isAdmin();
  }

  canCreate(): boolean {
    return this.isAdmin();
  }

  canEdit(): boolean {
    return this.hasAnyRole(['ADMIN', 'USER']);
  }

  isOwnRecord(matricule: string): boolean {
    const username = this.currentUser?.username || '';
    return username.toLowerCase() === (matricule || '').toLowerCase();
  }

  canEditSalarie(matricule: string): boolean {
    return this.isAdmin() || this.isOwnRecord(matricule);
  }

  private readStoredUser(): AuthUser | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }
}

