import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/pages/main/main').then(m => m.Main)
  },
  {
    path: '**',
    loadComponent: () => import('./components/pages/not-found/not-found').then(m => m.NotFound)
  }
];
