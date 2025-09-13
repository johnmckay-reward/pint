import { Component, OnInit } from '@angular/core';
import { NavController, LoadingController, AlertController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { ApiService, User } from '../services/api.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false // This is not a standalone component, so we set this to false.
})
export class ProfilePage implements OnInit {

  // User data. Will be loaded from the API.
  user: User | null = null;
  isLoading = false;

  constructor(
    private navCtrl: NavController,
    private authService: AuthService,
    private apiService: ApiService,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.loadUserProfile();
  }

  /**
   * @description
   * Loads the current user's profile from the API.
   */
  async loadUserProfile(): Promise<void> {
    this.isLoading = true;
    
    try {
      // First try to get from auth service
      this.user = this.authService.currentUser;
      
      // If we have the user, try to get fresh profile data
      if (this.user) {
        try {
          const freshProfile = await this.apiService.getUserProfile().toPromise();
          if (freshProfile) {
            this.user = freshProfile;
          }
        } catch (error) {
          console.warn('Failed to fetch fresh profile data, using cached data');
        }
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      await this.presentErrorAlert('Error', 'Failed to load profile data.');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * @description
   * Navigates to the profile editing page.
   */
  editProfile(): void {
    console.log('Navigating to edit profile page...');
    // This could navigate to the onboarding page again, or a new 'edit-profile' page.
    this.navCtrl.navigateForward('/edit-profile');
  }

  /**
   * @description
   * Navigates to a settings page (to be created).
   */
  goToSettings(): void {
    console.log('Navigating to settings...');
    this.navCtrl.navigateForward('/settings');
  }

  /**
   * @description
   * Navigates to the subscription page.
   */
  goToSubscription(): void {
    console.log('Navigating to subscription...');
    this.navCtrl.navigateForward('/subscription');
  }

  /**
   * @description
   * Navigates to a help page (to be created).
   */
  goToHelp(): void {
    console.log('Navigating to help...');
    this.navCtrl.navigateForward('/help');
  }

  /**
   * @description
   * Logs the user out and returns them to the login screen.
   */
  async logout(): Promise<void> {
    console.log('Logging out...');
    
    const loading = await this.loadingController.create({
      message: 'Signing out...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      await this.authService.clearAuthenticationState();
      await loading.dismiss();
      // Navigate back to the login page, clearing the history.
      this.navCtrl.navigateRoot('/login');
    } catch (error) {
      await loading.dismiss();
      console.error('Logout failed:', error);
      await this.presentErrorAlert('Error', 'Failed to log out. Please try again.');
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
