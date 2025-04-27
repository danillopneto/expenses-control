import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  if (auth.currentUser) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
