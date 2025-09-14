import { Component, OnInit, inject } from '@angular/core';
import { NavController, LoadingController, AlertController } from '@ionic/angular';
import { FirebaseAuthService } from '../services/firebase-auth.service';

// Interface for a Pub object
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
  selector: 'app-initiate-pint',
  templateUrl: './initiate-pint.page.html',
  styleUrls: ['./initiate-pint.page.scss'],
  standalone: false
})
export class InitiatePintPage implements OnInit {
  private navCtrl = inject(NavController);
  private authService = inject(FirebaseAuthService);
  private loadingController = inject(LoadingController);
  private alertController = inject(AlertController);

  mapCenter!: google.maps.LatLngLiteral;
  mapZoom = 15;
  nearbyPubs: Pub[] = [];
  isLoading = false;

  ngOnInit() {
    this.checkAuthenticationAndLoadLocation();
  }

  private async checkAuthenticationAndLoadLocation(): Promise<void> {
    // Ensure user is authenticated
    if (!this.authService.isAuthenticated) {
      await this.presentErrorAlert('Authentication Required', 'Please sign in to create a pint session.');
      this.navCtrl.navigateRoot('/login');
      return;
    }

    await this.loadUserLocation();
    this.loadNearbyPubs();
  }

  private async loadUserLocation(): Promise<void> {
    try {
      // Try to get user's current location
      if (navigator.geolocation) {
        const position = await this.getCurrentPosition();
        this.mapCenter = { 
          lat: position.coords.latitude, 
          lng: position.coords.longitude 
        };
      } else {
        // Fallback to default location (Bangor, Northern Ireland)
        this.mapCenter = { lat: 54.6616, lng: -5.6736 };
      }
    } catch (error) {
      console.log('Geolocation error, using default location:', error);
      // Fallback to default location
      this.mapCenter = { lat: 54.6616, lng: -5.6736 };
    }
  }

  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      });
    });
  }

  /**
   * @description
   * Loads mock data for nearby pubs. In a real app, this would come from the Google Places API.
   */
  loadNearbyPubs(): void {
    this.nearbyPubs = [
      {
        id: 'pub1', name: 'The Salty Dog', address: '10-12 Seacliff Road', distance: '150m',
        photo: 'https://placehold.co/120x120/4a2c2a/f4f1de?text=Salty+Dog',
        position: { lat: 54.6625, lng: -5.6710 }
      },
      {
        id: 'pub2', name: 'Jenny Watts', address: '41 High Street', distance: '300m',
        photo: 'https://placehold.co/120x120/4a2c2a/f4f1de?text=Jenny+Watts',
        position: { lat: 54.6595, lng: -5.6730 }
      },
      {
        id: 'pub3', name: 'The Imperial Bar', address: '32 Main Street', distance: '450m',
        photo: 'https://placehold.co/120x120/4a2c2a/f4f1de?text=Imperial',
        position: { lat: 54.6580, lng: -5.6750 }
      },
    ];
  }

  /**
   * @description
   * Handles the selection of a pub from the map or list.
   * Navigates to the confirmation page, passing the pub's data.
   * @param pub The selected pub object.
   */
  selectPub(pub: Pub): void {
    console.log('Selected pub:', pub.name);
    // Navigate to the confirmation page, passing the pub object in the state.
    this.navCtrl.navigateForward('/confirm-pint', {
      state: {
        selectedPub: pub
      }
    });
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
