import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: false
})
export class SettingsPage implements OnInit {

  // Property to hold the state of the notifications toggle
  notificationsEnabled: boolean = true;

  constructor(
    private navCtrl: NavController
  ) { }

  ngOnInit() {
    // In a real app, you would load the user's saved settings here.
    // For example:
    // this.settingsService.getSettings().subscribe(settings => {
    //   this.notificationsEnabled = settings.notifications;
    // });
  }

  /**
   * @description
   * Called when the notification toggle is changed.
   */
  onToggleChange(): void {
    console.log('Notifications enabled:', this.notificationsEnabled);
    // TODO: Save this setting to user's profile/device storage.
  }

  /**
   * @description
   * Navigates to a more detailed notification preferences screen.
   */
  manageNotificationPrefs(): void {
    console.log('Navigating to notification preferences...');
    this.navCtrl.navigateForward('/notification-preferences');
  }

  /**
   * @description
   * Navigates to the edit profile page.
   */
  editProfile(): void {
    console.log('Navigating to edit profile...');
    this.navCtrl.navigateForward('/edit-profile');
  }

  /**
   * @description
   * Navigates to an account management screen.
   */
  manageAccount(): void {
    console.log('Navigating to manage account...');
    this.navCtrl.navigateForward('/manage-account');
  }

  /**
   * @description
   * Opens the privacy policy.
   */
  viewPrivacyPolicy(): void {
    console.log('Opening privacy policy...');
    // TODO: Open a web browser with the privacy policy URL.
  }

  /**
   * @description
   * Opens the terms of service.
   */
  viewTermsOfService(): void {
    console.log('Opening terms of service...');
    // TODO: Open a web browser with the terms of service URL.
  }
}
