import { Component, OnInit, inject } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.page.html',
  styleUrls: ['./edit-profile.page.scss'],
  standalone: false
})
export class EditProfilePage implements OnInit {
  private navCtrl = inject(NavController);


  // Data-bound properties for the form fields
  displayName: string = '';
  favouriteTipple: string = '';
  profilePictureUrl: string | null = null;

  ngOnInit() {
    // In a real app, you would fetch the current user's data from a service
    // to pre-populate the form. For now, we'll use mock data.
    this.loadCurrentUserProfile();
  }

  /**
   * @description
   * Loads the current user's data into the component's properties.
   */
  loadCurrentUserProfile(): void {
    // This is where you'd call your user service.
    // const currentUser = this.userService.getCurrentUser();
    const mockUser = {
      name: 'John Doe',
      tipple: 'A crisp lager',
      avatar: 'https://placehold.co/150x150/f4f1de/4a2c2a?text=Me',
    };

    this.displayName = mockUser.name;
    this.favouriteTipple = mockUser.tipple;
    this.profilePictureUrl = mockUser.avatar;
  }

  /**
   * @description
   * Placeholder for triggering the camera/photo gallery to select a new profile picture.
   */
  selectProfilePicture(): void {
    console.log('Opening image selector to change profile picture...');
    // TODO: Implement Capacitor Camera plugin logic.
    // On selection, update this.profilePictureUrl.
    this.profilePictureUrl = 'https://placehold.co/150x150/eaa221/4a2c2a?text=New!';
  }

  /**
   * @description
   * Saves the updated profile data and navigates back to the profile page.
   */
  saveChanges(): void {
    if (!this.displayName) {
      console.error('Display name cannot be empty.');
      return;
    }

    const updatedProfileData = {
      name: this.displayName,
      tipple: this.favouriteTipple,
      picture: this.profilePictureUrl,
    };

    console.log('Saving updated profile:', updatedProfileData);
    // TODO: Implement logic to save this data to Firebase Firestore.

    // After saving, navigate back to the previous page (the profile page).
    this.navCtrl.back();
  }
}
