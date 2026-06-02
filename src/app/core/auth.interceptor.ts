import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../core/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {
  // Éviter les boucles infinies si le refresh lui-même retourne 401
  private isRefreshing = false;

  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Ne pas intercepter les appels auth eux-mêmes
    if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
      return next.handle(req);
    }

    // Ne pas intercepter les APIs externes (OSRM, Nominatim, etc.)
    // — ajouter Authorization sur une URL externe cause un échec CORS preflight
    if (req.url.startsWith('https://') && !req.url.includes('localhost')) {
      return next.handle(req);
    }

    const currentUser = this.auth.currentUser;
    let authReq = req;

    if (currentUser?.token) {
      authReq = req.clone({ setHeaders: { Authorization: currentUser.token } });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !this.isRefreshing) {
          this.isRefreshing = true;

          return this.auth.refreshAccessToken().pipe(
            switchMap((success: boolean) => {
              this.isRefreshing = false;
              if (success) {
                // Relancer la requête originale avec le nouveau token
                const newToken = this.auth.currentUser?.token;
                const retried = req.clone({
                  setHeaders: { Authorization: newToken || '' }
                });
                return next.handle(retried);
              } else {
                // Refresh échoué → déconnexion
                this.auth.logout();
                this.router.navigate(['/login']);
                return throwError(() => error);
              }
            })
          );
        }
        return throwError(() => error);
      })
    );
  }
}

