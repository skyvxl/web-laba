import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { take, map } from 'rxjs';

export const AuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const routes = inject(Router);

  return authService.getAuthState().pipe(
    take(1),
    map((user) => (user ? true : routes.createUrlTree(['/login']))),
  );
};

export const publicGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getAuthState().pipe(
    take(1),
    map((user) => (user ? router.createUrlTree(['/']) : true)),
  );
};
