import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DashboardPageRoutingModule } from './dashboard-routing.module';
import { DashboardPage } from './dashboard.page';
import { EmptyStateComponent } from '../components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../components/skeleton-loader/skeleton-loader.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DashboardPageRoutingModule,
    EmptyStateComponent,
    SkeletonLoaderComponent
  ],
  declarations: [DashboardPage]
})
export class DashboardPageModule {}
