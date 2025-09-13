import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './services/auth.guard';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./register/register.module').then(m => m.RegisterPageModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    loadChildren: () => import('./profile/profile.module').then(m => m.ProfilePageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'edit-profile',
    loadChildren: () => import('./edit-profile/edit-profile.module').then(m => m.EditProfilePageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'settings',
    loadChildren: () => import('./settings/settings.module').then(m => m.SettingsPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'manage-account',
    loadChildren: () => import('./manage-account/manage-account.module').then(m => m.ManageAccountPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'notification-preferences',
    loadChildren: () => import('./notification-preferences/notification-preferences.module').then(m => m.NotificationPreferencesPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'help',
    loadChildren: () => import('./support/support.module').then(m => m.SupportPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'initiate-pint',
    loadChildren: () => import('./initiate-pint/initiate-pint.module').then(m => m.InitiatePintPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'confirm-pint',
    loadChildren: () => import('./confirm-pint/confirm-pint.module').then(m => m.ConfirmPintPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'pint-details/:pintId',
    loadChildren: () => import('./pint-details/pint-details.module').then(m => m.PintDetailsPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'friends',
    loadChildren: () => import('./friends/friends.module').then( m => m.FriendsPageModule)
  },
  {
    path: 'subscription',
    loadChildren: () => import('./subscription/subscription.module').then( m => m.SubscriptionPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
