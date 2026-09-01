import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Login } from '../services/login';
import { firstValueFrom } from 'rxjs';

export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const loginService = inject(Login);

  const token = localStorage.getItem('userToken');

  // No token — redirect to login
  if (!token) {
    router.navigateByUrl('/login');
    return false;
  }

  // Validate token with the backend
  try {
    const res: any = await firstValueFrom(loginService.verifyToken({ token }));

    if (res.valid === true) {
      return true;
    }

    // Token is invalid — clear it and redirect
    localStorage.removeItem('userToken');
    localStorage.removeItem('userName');
    router.navigateByUrl('/login');
    return false;
  } catch (_error) {
    // API error — clear token and redirect
    localStorage.removeItem('userToken');
    localStorage.removeItem('userName');
    router.navigateByUrl('/login');
    return false;
  }
};

