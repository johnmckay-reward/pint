import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConfirmPintPage } from './confirm-pint.page';

const routes: Routes = [
  {
    path: '',
    component: ConfirmPintPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConfirmPintPageRoutingModule {}
