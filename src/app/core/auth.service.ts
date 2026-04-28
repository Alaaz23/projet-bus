import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthUser, UserRole } from './auth.types';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'busTracking.auth';
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
                token: response.token
              };

              localStorage.setItem(this.storageKey, JSON.stringify(authUser));
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

  logout(): void {
    localStorage.removeItem(this.storageKey);
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

  /** Renvoie true si l'utilisateur connecté est le propriétaire de l'enregistrement */
  isOwnRecord(matricule: string): boolean {
    const username = this.currentUser?.username || '';
    return username.toLowerCase() === (matricule || '').toLowerCase();
  }

  /** Admin peut modifier n'importe quel salarié, USER uniquement le sien */
  canEditSalarie(matricule: string): boolean {
    return this.isAdmin() || this.isOwnRecord(matricule);
  }

  private readStoredUser(): AuthUser | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }
}
