import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular';

// Interfaces for our data structures
interface Attendee {
  id: string;
  name: string;
  avatar: string;
}

interface PintSession {
  id: string;
  pubName: string;
  eta: string;
  position: google.maps.LatLngLiteral;
  initiator: Attendee;
  attendees: Attendee[];
}

@Component({
  selector: 'app-pint-details',
  templateUrl: './pint-details.page.html',
  styleUrls: ['./pint-details.page.scss'],
  standalone: false
})
export class PintDetailsPage implements OnInit {

  pintSession: PintSession | null = null;

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    // In a real app, you'd get the ID from the route and fetch data from Firebase.
    const pintId = this.route.snapshot.paramMap.get('id');
    console.log('Fetching details for pint session:', pintId);
    this.loadPintSessionData(pintId);
  }

  /**
   * @description
   * Loads mock data for a pint session.
   * @param pintId The ID of the session to load.
   */
  loadPintSessionData(pintId: string | null): void {
    // Mock data for demonstration
    const initiator = { id: 'user2', name: 'Sarah', avatar: 'https://placehold.co/80x80/4a2c2a/f4f1de?text=S' };
    this.pintSession = {
      id: pintId || 'pint1',
      pubName: 'The Salty Dog',
      eta: 'Arriving now',
      position: { lat: 54.6625, lng: -5.6710 },
      initiator: initiator,
      attendees: [
        initiator,
        { id: 'user3', name: 'Mark', avatar: 'https://placehold.co/80x80/4a2c2a/f4f1de?text=M' },
        { id: 'user4', name: 'Chloe', avatar: 'https://placehold.co/80x80/4a2c2a/f4f1de?text=C' },
      ]
    };
  }

  /**
   * @description
   * Simulates the user joining the pint session.
   */
  async joinPint(): Promise<void> {
    console.log('User is joining the pint!');
    // TODO: Add logic here to update the session in Firebase, adding the current user to the attendees list.

    const toast = await this.toastController.create({
      message: `Great! See you at ${this.pintSession?.pubName}.`,
      duration: 3000,
      position: 'top',
      color: 'success'
    });
    toast.present();

    // Navigate back to the dashboard after joining.
    this.navCtrl.navigateRoot('/dashboard');
  }

  /**
   * @description
   * Navigates to the profile page of the user who was tapped.
   * @param userId The ID of the user to view.
   */
  viewProfile(userId: string): void {
    console.log('Viewing profile for user:', userId);
    // This would navigate to a generic profile view page, passing the user ID.
    // For now, we'll just log it.
    // this.navCtrl.navigateForward(`/user-profile/${userId}`);
  }
}
