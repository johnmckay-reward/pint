import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PintDetailsPage } from './pint-details.page';

const routes: Routes = [
  {
    path: '',
    component: PintDetailsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PintDetailsPageRoutingModule {}
