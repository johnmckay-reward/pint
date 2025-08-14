import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

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

  mapCenter!: google.maps.LatLngLiteral;
  mapZoom = 15;
  nearbyPubs: Pub[] = [];

  constructor(
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    // In a real app, you'd get the user's current location.
    // We'll use coordinates for Bangor, Northern Ireland as a default.
    this.mapCenter = { lat: 54.6616, lng: -5.6736 };
    this.loadNearbyPubs();
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
}
