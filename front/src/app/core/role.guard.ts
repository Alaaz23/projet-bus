import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserRole } from './auth.types';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowed = (route.data['roles'] ?? []) as UserRole[];

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (!allowed.length || auth.hasAnyRole(allowed)) {
    return true;
  }

  return router.createUrlTree(['/home']);
};
