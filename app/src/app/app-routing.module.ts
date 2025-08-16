import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

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
    loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardPageModule)
  },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule)
  },
  {
    path: 'profile',
    loadChildren: () => import('./profile/profile.module').then(m => m.ProfilePageModule)
  },
  {
    path: 'edit-profile',
    loadChildren: () => import('./edit-profile/edit-profile.module').then(m => m.EditProfilePageModule)
  },
  {
    path: 'settings',
    loadChildren: () => import('./settings/settings.module').then(m => m.SettingsPageModule)
  },
  {
    path: 'manage-account',
    loadChildren: () => import('./manage-account/manage-account.module').then(m => m.ManageAccountPageModule)
  },
  {
    path: 'notification-preferences',
    loadChildren: () => import('./notification-preferences/notification-preferences.module').then(m => m.NotificationPreferencesPageModule)
  },
  {
    path: 'help',
    loadChildren: () => import('./support/support.module').then(m => m.SupportPageModule)
  },
  {
    path: 'initiate-pint',
    loadChildren: () => import('./initiate-pint/initiate-pint.module').then(m => m.InitiatePintPageModule)
  },
  {
    path: 'confirm-pint',
    loadChildren: () => import('./confirm-pint/confirm-pint.module').then(m => m.ConfirmPintPageModule)
  },
  {
    path: 'pint-details/:pintId',
    loadChildren: () => import('./pint-details/pint-details.module').then(m => m.PintDetailsPageModule)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
