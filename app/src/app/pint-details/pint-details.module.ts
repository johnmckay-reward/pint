import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PintDetailsPageRoutingModule } from './pint-details-routing.module';

import { PintDetailsPage } from './pint-details.page';
import { ChatComponent } from '../components/chat/chat.component';
import { GoogleMapsModule } from '@angular/google-maps';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GoogleMapsModule,
    PintDetailsPageRoutingModule
  ],
  declarations: [PintDetailsPage, ChatComponent]
})
export class PintDetailsPageModule {}
