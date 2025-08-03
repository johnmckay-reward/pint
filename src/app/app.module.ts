import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { LoginPageRoutingModule } from './login/login-routing.module';
import { OnboardingPageRoutingModule } from './onboarding/onboarding-routing.module';
import { DashboardPageModule } from './dashboard/dashboard.module';
import { ProfilePageModule } from './profile/profile.module';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(),
    AppRoutingModule,
    LoginPageRoutingModule,
    OnboardingPageRoutingModule,
    DashboardPageModule,
    ProfilePageModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule { }
