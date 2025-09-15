import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, ToastController, LoadingController, AlertController } from '@ionic/angular';
import { FirestoreService, PintSession } from '../services/firestore.service';
import { FirebaseAuthService } from '../services/firebase-auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-pint-details',
  templateUrl: './pint-details.page.html',
  styleUrls: ['./pint-details.page.scss'],
  standalone: false
})
export class PintDetailsPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private navCtrl = inject(NavController);
  private toastController = inject(ToastController);
  private firestoreService = inject(FirestoreService);
  private authService = inject(FirebaseAuthService);
  private loadingController = inject(LoadingController);
  private alertController = inject(AlertController);

  pintSession: PintSession | null = null;
  isLoading = false;
  isJoining = false;
  private subscription = new Subscription();

  ngOnInit() {
    const pintId = this.route.snapshot.paramMap.get('pintId');
    console.log('Fetching details for pint session:', pintId);
    this.loadPintSessionData(pintId);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  /**
   * @description
   * Loads session data from Firebase with real-time updates.
   * @param pintId The ID of the session to load.
   */
  loadPintSessionData(pintId: string | null): void {
    if (!pintId) {
      console.error('No pint ID provided');
      this.navCtrl.navigateRoot('/dashboard');
      return;
    }

    this.isLoading = true;
    
    // Subscribe to real-time session updates
    this.subscription.add(
      this.firestoreService.getSessionDetails(pintId).subscribe({
        next: (session) => {
          this.pintSession = session;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load session details:', error);
          this.presentErrorAlert('Error', 'Failed to load session details.');
          this.navCtrl.navigateRoot('/dashboard');
          this.isLoading = false;
        }
      })
    );
  }

  /**
   * @description
   * Joins the current user to the pint session.
   */
  async joinPint(): Promise<void> {
    if (!this.pintSession || this.isJoining) return;

    // Check if user is already an attendee
    const currentUser = this.authService.currentUser;
    if (currentUser && this.pintSession.attendees?.some(attendee => attendee.id === currentUser.id)) {
      const toast = await this.toastController.create({
        message: 'You are already attending this session!',
        duration: 3000,
        position: 'top',
        color: 'warning'
      });
      await toast.present();
      return;
    }

    this.isJoining = true;
    const loading = await this.loadingController.create({
      message: 'Joining session...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      await this.firestoreService.joinSession(this.pintSession.id);
      
      console.log('Successfully joined session');
      
      const toast = await this.toastController.create({
        message: `Great! See you at ${this.pintSession.pubName}.`,
        duration: 3000,
        position: 'top',
        color: 'success'
      });
      await toast.present();
      
      // Session data will be updated automatically via real-time subscription
    } catch (error) {
      console.error('Failed to join session:', error);
      await this.presentErrorAlert('Error', 'Failed to join session. Please try again.');
    } finally {
      loading.dismiss();
      this.isJoining = false;
    }
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

  /**
   * @description
   * Checks if the current user is already attending this session.
   */
  isUserAttending(): boolean {
    const currentUser = this.authService.currentUser;
    if (!currentUser || !this.pintSession?.attendees) return false;
    return this.pintSession.attendees.some(attendee => attendee.id === currentUser.id);
  }

  /**
   * @description
   * Gets the map center position from the session location data.
   */
  getMapCenter(): google.maps.LatLngLiteral | null {
    if (!this.pintSession?.location) return null;
    
    // Firebase uses simple {lat, lng} format from our Firestore service
    return {
      lat: this.pintSession.location.lat,
      lng: this.pintSession.location.lng
    };
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
