import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Analytics } from './pages/analytics/analytics';
import { Users } from './pages/users/users';
import { PubClaims } from './pages/pub-claims/pub-claims';
import { AuthGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { 
    path: 'dashboard', 
    component: Dashboard, 
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'analytics', pathMatch: 'full' },
      { path: 'analytics', component: Analytics },
      { path: 'users', component: Users },
      { path: 'pub-claims', component: PubClaims }
    ]
  },
  { path: '**', redirectTo: '/login' }
];
