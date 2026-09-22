import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StorageService } from './storage';

export const authGuard: CanActivateFn = () => {
  const storage = inject(StorageService);
  return storage.adapter.isLoggedIn() ? true : inject(Router).createUrlTree(['/admin/login']);
};
