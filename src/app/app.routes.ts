import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/pages/main/main').then((m) => m.Main),
  },
  {
    path: 'about',
    loadComponent: () => import('./components/pages/about/about').then((m) => m.About),
  },
  {
    path: 'contacts',
    loadComponent: () => import('./components/pages/contacts/contacts').then((m) => m.Contacts),
  },
  {
    path: 'catalog',
    loadComponent: () => import('./components/pages/catalog/catalog').then((m) => m.Catalog),
  },
  {
    path: 'product/:id',
    loadComponent: () => import('./components/pages/product/product').then((m) => m.ProductPage),
  },
  {
    path: '**',
    loadComponent: () => import('./components/pages/not-found/not-found').then((m) => m.NotFound),
  },
];
