import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
  standalone: false // This is important for Ionic components to work correctly
})
export class OnboardingPage implements OnInit {

  // Data-bound properties for the form fields
  displayName: string = '';
  favouriteTipple: string = '';
  profilePictureUrl: string | null = null; // Will hold the URL of the uploaded image

  constructor(
    private navCtrl: NavController
  ) { }

  ngOnInit() {
    // Here you might pre-populate the display name from the social login provider
    // e.g., this.displayName = this.authService.getCurrentUser().displayName;
  }

  /**
   * @description
   * Placeholder for triggering the camera/photo gallery to select a profile picture.
   */
  selectProfilePicture(): void {
    console.log('Opening image selector...');
    // TODO: Implement Capacitor Camera plugin logic here.
    // For now, we'll just set a placeholder image to show the UI works.
    this.profilePictureUrl = 'https://placehold.co/150x150/eaa221/4a2c2a?text=You!';
  }

  /**
   * @description
   * Saves the profile data and navigates the user to the main app interface.
   */
  completeProfile(): void {
    if (!this.displayName) {
      // This case is handled by the disabled button, but it's good practice to check.
      console.error('Display name is required.');
      return;
    }

    const profileData = {
      name: this.displayName,
      tipple: this.favouriteTipple,
      picture: this.profilePictureUrl,
    };

    console.log('Saving profile:', profileData);
    // TODO: Implement logic to save this data to Firebase Firestore.

    // After saving, navigate to the main dashboard.
    // The 'navigateRoot' method clears the navigation stack, so the user can't
    // go back to the onboarding or login pages.
    this.navCtrl.navigateRoot('/tabs/dashboard');
  }
}
