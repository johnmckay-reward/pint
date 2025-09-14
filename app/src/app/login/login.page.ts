// src/app/pages/login/login.page.ts
import { Component, OnInit, inject } from '@angular/core';
import { NavController, AlertController, LoadingController } from '@ionic/angular';
import { FirebaseAuthService } from '../services/firebase-auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {
  private navCtrl = inject(NavController);
  private authService = inject(FirebaseAuthService);
  private alertController = inject(AlertController);

  isLoading = false;
  errorMessage = '';

  constructor() {}

  ngOnInit() {
    console.log('LoginPage initialized');
    
    // Check if user is already authenticated
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.navCtrl.navigateRoot('/dashboard');
      }
    });
  }

  /**
   * @description Handles Google sign-in using Firebase Auth
   */
  async signInWithGoogle(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.authService.signInWithGoogle();
      // Navigation will be handled by auth state listener
      this.navCtrl.navigateRoot('/dashboard');
    } catch (error: any) {
      console.error('Google sign-in failed', error);
      this.errorMessage = 'Failed to sign in with Google. Please try again.';
      this.presentErrorAlert('Sign-in Failed', this.errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * @description Handles Apple sign-in using Firebase Auth
   */
  async signInWithApple(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.authService.signInWithApple();
      // Navigation will be handled by auth state listener
      this.navCtrl.navigateRoot('/dashboard');
    } catch (error: any) {
      console.error('Apple sign-in failed', error);
      this.errorMessage = 'Failed to sign in with Apple. Please try again.';
      this.presentErrorAlert('Sign-in Failed', this.errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * @description Presents a generic error alert to the user.
   * @param header The title of the alert.
   * @param message The main message of the alert.
   */
  private async presentErrorAlert(header: string, message: string): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
