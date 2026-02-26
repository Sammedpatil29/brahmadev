import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'layout',
    loadComponent: () => import('./pages/layout/layout.page').then( m => m.LayoutPage),
    children: [
      {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then( m => m.HomePage)
  },
  {
    path: 'add-visit',
    loadComponent: () => import('./pages/add-visit/add-visit.page').then( m => m.AddVisitPage)
  },
  {
    path: 'history',
    loadComponent: () => import('./pages/history/history.page').then( m => m.HistoryPage)
  },
  {
    path: 'leads',
    loadComponent: () => import('./pages/leads/leads.page').then( m => m.LeadsPage)
  },
  {
    path: 'lead-details',
    loadComponent: () => import('./pages/lead-details/lead-details.page').then( m => m.LeadDetailsPage)
  },
   {
    path: 'quotation',
    loadComponent: () => import('./pages/quotation/quotation.page').then( m => m.QuotationPage)
  },
   {
    path: 'add-lead',
    loadComponent: () => import('./pages/add-lead/add-lead.page').then( m => m.AddLeadPage)
  },
  {
    path: 'items',
    loadComponent: () => import('./pages/items/items.page').then( m => m.ItemsPage)
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
    ]
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  }
];
