import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { Home } from './public/home';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'admin/login', loadComponent: () => import('./admin/login').then((m) => m.Login) },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./admin/admin-shell').then((m) => m.AdminShell),
    children: [
      { path: '', loadComponent: () => import('./admin/overview').then((m) => m.Overview) },
      { path: 'edit/:section', loadComponent: () => import('./admin/editor').then((m) => m.Editor) },
      { path: 'backup', loadComponent: () => import('./admin/backup').then((m) => m.Backup) },
    ],
  },
  { path: '**', redirectTo: '' },
];
