import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { InitiatePintPage } from './initiate-pint.page';

const routes: Routes = [
  {
    path: '',
    component: InitiatePintPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InitiatePintPageRoutingModule {}
