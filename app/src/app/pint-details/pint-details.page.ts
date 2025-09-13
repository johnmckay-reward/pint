import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, ToastController, LoadingController, AlertController } from '@ionic/angular';
import { ApiService, PintSession } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-pint-details',
  templateUrl: './pint-details.page.html',
  styleUrls: ['./pint-details.page.scss'],
  standalone: false
})
export class PintDetailsPage implements OnInit {

  pintSession: PintSession | null = null;
  isLoading = false;
  isJoining = false;

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private toastController: ToastController,
    private apiService: ApiService,
    private authService: AuthService,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    const pintId = this.route.snapshot.paramMap.get('pintId');
    console.log('Fetching details for pint session:', pintId);
    this.loadPintSessionData(pintId);
  }

  /**
   * @description
   * Loads session data from the API.
   * @param pintId The ID of the session to load.
   */
  async loadPintSessionData(pintId: string | null): Promise<void> {
    if (!pintId) {
      console.error('No pint ID provided');
      this.navCtrl.navigateRoot('/dashboard');
      return;
    }

    this.isLoading = true;
    
    try {
      this.pintSession = await this.apiService.getSessionDetails(pintId).toPromise() || null;
    } catch (error) {
      console.error('Failed to load session details:', error);
      await this.presentErrorAlert('Error', 'Failed to load session details.');
      this.navCtrl.navigateRoot('/dashboard');
    } finally {
      this.isLoading = false;
    }
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
      toast.present();
      return;
    }

    this.isJoining = true;
    const loading = await this.loadingController.create({
      message: 'Joining session...',
      spinner: 'crescent'
    });
    await loading.present();

    this.apiService.joinSession(this.pintSession.id)
      .pipe(
        finalize(() => {
          loading.dismiss();
          this.isJoining = false;
        })
      )
      .subscribe({
        next: async (response) => {
          console.log('Successfully joined session:', response);
          
          const toast = await this.toastController.create({
            message: `Great! See you at ${this.pintSession?.pubName}.`,
            duration: 3000,
            position: 'top',
            color: 'success'
          });
          toast.present();

          // Refresh the session data to show updated attendees
          await this.loadPintSessionData(this.pintSession!.id);
        },
        error: async (err) => {
          console.error('Failed to join session:', err);
          const message = err.error?.error || 'Failed to join session. Please try again.';
          await this.presentErrorAlert('Error', message);
        }
      });
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
    
    // Handle PostGIS GEOMETRY point format
    if (this.pintSession.location.coordinates) {
      return {
        lng: this.pintSession.location.coordinates[0],
        lat: this.pintSession.location.coordinates[1]
      };
    }
    
    // Handle simple {lat, lng} format
    if (this.pintSession.location.lat && this.pintSession.location.lng) {
      return {
        lat: this.pintSession.location.lat,
        lng: this.pintSession.location.lng
      };
    }
    
    return null;
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
