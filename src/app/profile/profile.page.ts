import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

// Interface for a User object for type safety
interface UserProfile {
  name: string;
  tipple: string;
  avatar: string;
  stats: {
    pintsStarted: number;
    pintsJoined: number;
    favouritePubs: number;
  };
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false // This is not a standalone component, so we set this to false.
})
export class ProfilePage implements OnInit {

  // Mock user data object. In a real app, this would be fetched from a service.
  user: UserProfile = {
    name: 'John Doe',
    tipple: 'A crisp lager',
    avatar: 'https://placehold.co/150x150/f4f1de/4a2c2a?text=Me',
    stats: {
      pintsStarted: 5,
      pintsJoined: 12,
      favouritePubs: 3,
    },
  };

  constructor(
    private navCtrl: NavController
  ) { }

  ngOnInit() {
    // In a real app, you would fetch the logged-in user's data here.
    // For example:
    // this.userService.getCurrentUser().subscribe(profile => this.user = profile);
  }

  /**
   * @description
   * Navigates to the profile editing page.
   */
  editProfile(): void {
    console.log('Navigating to edit profile page...');
    // This could navigate to the onboarding page again, or a new 'edit-profile' page.
    this.navCtrl.navigateForward('/onboarding');
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
  logout(): void {
    console.log('Logging out...');
    // TODO: Add Firebase logout logic here.

    // Navigate back to the login page, clearing the history.
    this.navCtrl.navigateRoot('/login');
  }
}
