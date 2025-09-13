import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import * as Sentry from '@sentry/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { LoginPageRoutingModule } from './login/login-routing.module';
import { DashboardPageModule } from './dashboard/dashboard.module';
import { ProfilePageModule } from './profile/profile.module';
import { EditProfilePageModule } from './edit-profile/edit-profile.module';
import { SettingsPageModule } from './settings/settings.module';
import { ManageAccountPageModule } from './manage-account/manage-account.module';
import { NotificationPreferencesPageModule } from './notification-preferences/notification-preferences.module';
import { SupportPageModule } from './support/support.module';
import { InitiatePintPageModule } from './initiate-pint/initiate-pint.module';
import { ConfirmPintPageModule } from './confirm-pint/confirm-pint.module';
import { PintDetailsPageModule } from './pint-details/pint-details.module';
import { FriendsPageModule } from './friends/friends.module';
import { provideHttpClient, withInterceptors, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './services/auth.interceptor';
import { ErrorInterceptor } from './services/error.interceptor';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(),
    AppRoutingModule,
    LoginPageRoutingModule,
    DashboardPageModule,
    ProfilePageModule,
    EditProfilePageModule,
    SettingsPageModule,
    ManageAccountPageModule,
    NotificationPreferencesPageModule,
    SupportPageModule,
    InitiatePintPageModule,
    ConfirmPintPageModule,
    PintDetailsPageModule,
    FriendsPageModule
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { 
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler({
        showDialog: false, // Don't show Sentry dialog in production
      }),
    },
    provideHttpClient()
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
