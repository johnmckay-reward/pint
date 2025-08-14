import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular';

// Re-using the Pub interface from the previous page
interface Pub {
  id: string;
  name: string;
  address: string;
  distance: string;
  photo: string;
  position: {
    lat: number;
    lng: number;
  };
}

@Component({
  selector: 'app-confirm-pint',
  templateUrl: './confirm-pint.page.html',
  styleUrls: ['./confirm-pint.page.scss'],
  standalone: false
})
export class ConfirmPintPage implements OnInit {

  selectedPub: Pub | null = null;
  eta: string = 'now'; // Default ETA value

  constructor(
    private router: Router,
    private navCtrl: NavController,
    private toastController: ToastController
  ) {
    // Retrieve the state passed during navigation
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.selectedPub = navigation.extras.state['selectedPub'];
    }
  }

  ngOnInit() {
    // Check if we received a pub, if not, the user might have refreshed the page.
    if (!this.selectedPub) {
      console.error('No pub data found. Navigating back.');
      // Optional: Navigate back if no data is present
      // this.navCtrl.back();
    }
  }

  /**
   * @description
   * Simulates sending the pint invitation and navigates the user back to the dashboard.
   */
  async sendInvite(): Promise<void> {
    if (!this.selectedPub) return;

    const pintSession = {
      pub: this.selectedPub,
      eta: this.eta,
      timestamp: new Date()
    };

    console.log('Sending pint invite:', pintSession);
    // TODO: Implement actual Firebase/backend logic to create the session and send push notifications.

    // Show a success toast message
    const toast = await this.toastController.create({
      message: `Your pint at ${this.selectedPub.name} has been started!`,
      duration: 3000,
      position: 'top',
      color: 'success'
    });
    toast.present();

    // Navigate back to the root dashboard page, clearing the initiation flow from the history.
    this.navCtrl.navigateRoot('/dashboard');
  }

  /**
   * @description
   * A helper function to navigate back if the page is loaded without state.
   */
  goBack(): void {
    this.navCtrl.back();
  }
}
