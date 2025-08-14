import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { NotificationPreferencesPageRoutingModule } from './notification-preferences-routing.module';

import { NotificationPreferencesPage } from './notification-preferences.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NotificationPreferencesPageRoutingModule
  ],
  declarations: [NotificationPreferencesPage]
})
export class NotificationPreferencesPageModule {}
