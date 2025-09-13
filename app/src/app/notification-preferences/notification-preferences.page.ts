import { Component, OnInit, inject } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-notification-preferences',
  templateUrl: './notification-preferences.page.html',
  styleUrls: ['./notification-preferences.page.scss'],
  standalone: false
})
export class NotificationPreferencesPage implements OnInit {
  private navCtrl = inject(NavController);


  // Data-bound properties for the settings
  notificationRadius: number = 5; // Default value in km
  notificationSound: string = 'default';

  ngOnInit() {
    // In a real app, you would load the user's saved preferences here.
    this.loadCurrentPreferences();
  }

  /**
   * @description
   * Loads the user's current preferences from storage/service.
   */
  loadCurrentPreferences(): void {
    // const currentPrefs = this.settingsService.getNotificationPrefs();
    const mockPrefs = {
      radius: 3,
      sound: 'cheers',
    };
    this.notificationRadius = mockPrefs.radius;
    this.notificationSound = mockPrefs.sound;
  }

  /**
   * @description
   * Logs the change in radius value. Could be used for real-time feedback.
   */
  onRadiusChange(): void {
    console.log('Radius changed to:', this.notificationRadius);
  }

  /**
   * @description
   * Logs the change in sound preference. Could be used to play a sample of the sound.
   */
  onSoundChange(): void {
    console.log('Sound changed to:', this.notificationSound);
    // Optional: Play a preview of the selected sound.
  }

  /**
   * @description
   * Saves the chosen preferences and navigates back.
   */
  savePreferences(): void {
    const preferences = {
      radius: this.notificationRadius,
      sound: this.notificationSound,
    };

    console.log('Saving notification preferences:', preferences);
    // TODO: Implement logic to save these settings to Firebase/device storage.

    // Navigate back to the previous screen (settings page).
    this.navCtrl.back();
  }
}
