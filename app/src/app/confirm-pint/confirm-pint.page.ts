import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NavController, ToastController, LoadingController, AlertController } from '@ionic/angular';
import { FirestoreService } from '../services/firestore.service';
import { FirebaseAuthService } from '../services/firebase-auth.service';
import { finalize } from 'rxjs/operators';

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
  private router = inject(Router);
  private navCtrl = inject(NavController);
  private toastController = inject(ToastController);
  private firestoreService = inject(FirestoreService);
  private authService = inject(FirebaseAuthService);
  private loadingController = inject(LoadingController);
  private alertController = inject(AlertController);

  selectedPub: Pub | null = null;
  eta: string = 'now'; // Default ETA value

  constructor() {
    // Retrieve the state passed during navigation
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.selectedPub = navigation.extras.state['selectedPub'];
    }
  }

  ngOnInit() {
    // Check if we received a pub and user is authenticated
    if (!this.selectedPub) {
      console.error('No pub data found. Navigating back.');
      this.navCtrl.back();
      return;
    }

    if (!this.authService.isAuthenticated) {
      console.error('User not authenticated. Navigating to login.');
      this.navCtrl.navigateRoot('/login');
      return;
    }
  }

  /**
   * @description
   * Creates a pint session via Firebase and navigates back to the dashboard.
   */
  async sendInvite(): Promise<void> {
    if (!this.selectedPub) return;

    const loading = await this.loadingController.create({
      message: 'Creating pint session...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const sessionId = await this.firestoreService.createSession({
        pubName: this.selectedPub.name,
        eta: this.eta,
        location: {
          lat: this.selectedPub.position.lat,
          lng: this.selectedPub.position.lng
        },
        isPrivate: false
      });

      console.log('Session created successfully with ID:', sessionId);
      
      // Show a success toast message
      const toast = await this.toastController.create({
        message: `Your pint at ${this.selectedPub.name} has been started!`,
        duration: 3000,
        position: 'top',
        color: 'success'
      });
      await toast.present();

      // Navigate back to the dashboard
      this.navCtrl.navigateRoot('/dashboard');
    } catch (error) {
      console.error('Failed to create session:', error);
      await this.presentErrorAlert('Error', 'Failed to create pint session. Please try again.');
    } finally {
      loading.dismiss();
    }
  }

  /**
   * @description
   * A helper function to navigate back if the page is loaded without state.
   */
  goBack(): void {
    this.navCtrl.back();
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
