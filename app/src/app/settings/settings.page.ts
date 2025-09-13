import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NavController } from '@ionic/angular';
import { ThemeService, ThemeMode } from '../services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: false
})
export class SettingsPage implements OnInit, OnDestroy {

  // Property to hold the state of the notifications toggle
  notificationsEnabled: boolean = true;
  
  // Theme properties
  currentTheme: ThemeMode = 'auto';
  isDarkMode: boolean = false;
  
  private subscriptions = new Subscription();

  // Use inject() function for dependency injection
  private navCtrl = inject(NavController);
  private themeService = inject(ThemeService);

  ngOnInit() {
    // Load theme settings
    this.subscriptions.add(
      this.themeService.theme$.subscribe(theme => {
        this.currentTheme = theme;
        this.isDarkMode = this.themeService.isDarkMode();
      })
    );
    
    // In a real app, you would load the user's saved settings here.
    // For example:
    // this.settingsService.getSettings().subscribe(settings => {
    //   this.notificationsEnabled = settings.notifications;
    // });
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  /**
   * @description
   * Toggle the app theme between light, dark, and auto
   */
  async onThemeChange(): Promise<void> {
    await this.themeService.toggleTheme();
  }

  /**
   * @description
   * Get display text for current theme
   */
  getThemeDisplayText(): string {
    switch (this.currentTheme) {
      case 'light':
        return 'Light Mode';
      case 'dark':
        return 'Dark Mode';
      case 'auto':
      default:
        return 'Auto (System)';
    }
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

  /**
   * @description
   * Opens email client to contact support.
   */
  contactSupport(): void {
    console.log('Opening support email...');
    const supportEmail = 'support@pint-app.com';
    const subject = 'Pint? App Support Request';
    const body = 'Hi there,\n\nI need help with:\n\n[Please describe your issue here]\n\nThanks!';
    
    const mailtoUrl = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_system');
  }

  /**
   * @description
   * Opens FAQ/Help page.
   */
  viewFAQ(): void {
    console.log('Opening FAQ...');
    // In a real app, you could navigate to an in-app FAQ page or open a web URL
    const faqUrl = 'https://pint-app.com/faq';
    window.open(faqUrl, '_blank');
  }
}
