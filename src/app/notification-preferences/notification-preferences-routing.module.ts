import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NotificationPreferencesPage } from './notification-preferences.page';

const routes: Routes = [
  {
    path: '',
    component: NotificationPreferencesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NotificationPreferencesPageRoutingModule {}
