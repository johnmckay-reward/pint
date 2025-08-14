import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ConfirmPintPageRoutingModule } from './confirm-pint-routing.module';

import { ConfirmPintPage } from './confirm-pint.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ConfirmPintPageRoutingModule
  ],
  declarations: [ConfirmPintPage]
})
export class ConfirmPintPageModule {}
