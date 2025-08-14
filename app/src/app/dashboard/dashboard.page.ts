import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

// Interface for a Pint Session object for type safety
interface PintSession {
  id: string;
  pubName: string;
  distance: string;
  timeAgo: string;
  initiator: {
    name: string;
    avatar: string;
  };
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false // This is not a standalone component, so we set this to false.
})
export class DashboardPage implements OnInit {

  // Array to hold nearby pint sessions. Initially empty.
  nearbyPints: PintSession[] = [];

  constructor(
    private navCtrl: NavController
  ) { }

  ngOnInit() {
    // In a real app, you would fetch this data from a service (e.g., via Firebase).
    // For now, we'll populate it with mock data after a short delay to simulate a network request.
    setTimeout(() => {
      this.loadNearbyPints();
    }, 1000);
  }

  /**
   * @description
   * Loads mock data for nearby pint sessions.
   */
  loadNearbyPints(): void {
    this.nearbyPints = [
      {
        id: 'pint1',
        pubName: 'The Salty Dog',
        distance: '0.2 miles',
        timeAgo: '5m ago',
        initiator: { name: 'Sarah', avatar: 'https://placehold.co/80x80/4a2c2a/f4f1de?text=S' }
      },
      {
        id: 'pint2',
        pubName: "Jenny Watts",
        distance: '0.4 miles',
        timeAgo: '12m ago',
        initiator: { name: 'Mark', avatar: 'https://placehold.co/80x80/4a2c2a/f4f1de?text=M' }
      },
      {
        id: 'pint3',
        pubName: 'The Imperial Bar',
        distance: '0.5 miles',
        timeAgo: '28m ago',
        initiator: { name: 'Chloe', avatar: 'https://placehold.co/80x80/4a2c2a/f4f1de?text=C' }
      }
    ];
  }

  /**
   * @description
   * Navigates to the screen for initiating a new pint session.
   */
  initiatePint(): void {
    console.log('Navigating to initiate pint flow...');
    // We'll navigate to a page that we can create later.
    this.navCtrl.navigateForward('/initiate-pint');
  }

  /**
   * @description
   * Navigates to the details of a specific pint session.
   * @param pintId The ID of the pint session to view.
   */
  viewPintSession(pintId: string): void {
    console.log('Viewing pint session:', pintId);
    // Navigate to a details page, passing the ID as a parameter.
    this.navCtrl.navigateForward(`/pint-details/${pintId}`);
  }

  /**
   * @description
   * Navigates to the user's own profile page.
   */
  goToProfile(): void {
    console.log('Navigating to profile page...');
    this.navCtrl.navigateForward('/profile');
  }
}
