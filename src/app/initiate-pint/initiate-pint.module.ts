import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { InitiatePintPageRoutingModule } from './initiate-pint-routing.module';

import { InitiatePintPage } from './initiate-pint.page';
import { GoogleMapsModule } from '@angular/google-maps';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GoogleMapsModule,
    InitiatePintPageRoutingModule
  ],
  declarations: [InitiatePintPage]
})
export class InitiatePintPageModule {}
