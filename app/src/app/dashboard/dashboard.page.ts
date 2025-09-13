import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NavController, AlertController, LoadingController } from '@ionic/angular';
import { ApiService, PintSession, FilteredSessionsResponse } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { PersonalizationService, PersonalizedContent } from '../services/personalization.service';
import { HapticService } from '../services/haptic.service';
import { ThemeService } from '../services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false // This is not a standalone component, so we set this to false.
})
export class DashboardPage implements OnInit, OnDestroy {

  // Array to hold nearby pint sessions. Initially empty.
  nearbyPints: PintSession[] = [];
  isLoading = false;
  
  // Filter properties
  pubNameFilter = '';
  dateFilter = '';
  showFilters = false;
  showFeaturedOnly = false;

  // Personalization properties
  personalizedContent: PersonalizedContent | null = null;
  userName: string = '';
  currentLocation: string = '';

  private subscriptions = new Subscription();

  // Use inject() function for dependency injection
  private navCtrl = inject(NavController);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private alertController = inject(AlertController);
  private loadingController = inject(LoadingController);
  private personalizationService = inject(PersonalizationService);
  private hapticService = inject(HapticService);
  private themeService = inject(ThemeService);

  ngOnInit() {
    this.loadPersonalizedContent();
    this.loadUserInfo();
    this.loadSessions();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private loadPersonalizedContent(): void {
    // Subscribe to personalization content updates
    this.subscriptions.add(
      this.personalizationService.content$.subscribe(content => {
        this.personalizedContent = content;
      })
    );
  }

  private loadUserInfo(): void {
    // Load user information for personalization
    // This would typically come from the auth service or user profile
    this.userName = 'there'; // Default fallback
    this.currentLocation = 'your area'; // Default fallback
    
    // TODO: Get actual user name and location from user profile/API
  }

  /**
   * @description
   * Loads session data from the API with optional filtering.
   */
  async loadSessions(): Promise<void> {
    this.isLoading = true;

    try {
      // Use filtered sessions method
      const response = await this.apiService.getFilteredSessions(
        this.pubNameFilter || undefined,
        this.dateFilter || undefined
      ).toPromise();
      
      if (response) {
        let sessions = response.sessions;
        
        // Apply client-side featured filter if enabled
        if (this.showFeaturedOnly) {
          sessions = sessions.filter(session => session.isFeatured);
        }
        
        this.nearbyPints = sessions;
      } else {
        this.nearbyPints = [];
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
      // Fall back to mock data if API fails
      this.loadMockData();
      await this.presentErrorAlert('Error', 'Failed to load sessions. Showing sample data.');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Apply filters and reload sessions
   */
  async applyFilters(): Promise<void> {
    await this.loadSessions();
  }

  /**
   * Clear all filters and reload sessions
   */
  async clearFilters(): Promise<void> {
    this.pubNameFilter = '';
    this.dateFilter = '';
    this.showFeaturedOnly = false;
    await this.loadSessions();
  }

  /**
   * Toggle filter visibility
   */
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  /**
   * @description
   * Loads mock data for development/testing purposes.
   */
  loadMockData(): void {
    this.nearbyPints = [
      {
        id: 'mock1',
        pubName: 'The Salty Dog',
        eta: '20:00',
        location: { lat: 51.5074, lng: -0.1278 },
        isPrivate: false,
        isFeatured: true, // Featured session
        initiator: { 
          id: '1',
          displayName: 'Sarah',
          email: 'sarah@example.com',
          profilePictureUrl: 'https://placehold.co/80x80/4a2c2a/f4f1de?text=S' 
        },
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 minutes ago
      },
      {
        id: 'mock2',
        pubName: "Jenny Watts",
        eta: '19:30',
        location: { lat: 51.5074, lng: -0.1278 },
        isPrivate: false,
        isFeatured: false, // Regular session
        initiator: { 
          id: '2',
          displayName: 'Mark',
          email: 'mark@example.com',
          profilePictureUrl: 'https://placehold.co/80x80/4a2c2a/f4f1de?text=M' 
        },
        createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString() // 12 minutes ago
      },
      {
        id: 'mock3',
        pubName: 'The Crown & Anchor',
        eta: '21:15',
        location: { lat: 51.5074, lng: -0.1278 },
        isPrivate: false,
        isFeatured: true, // Another featured session
        initiator: { 
          id: '3',
          displayName: 'Alex',
          email: 'alex@example.com',
          profilePictureUrl: 'https://placehold.co/80x80/4a2c2a/f4f1de?text=A' 
        },
        createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString() // 25 minutes ago
      }
    ];
  }

  /**
   * @description
   * Navigates to the screen for initiating a new pint session.
   */
  async initiatePint(): Promise<void> {
    console.log('Navigating to initiate pint flow...');
    await this.hapticService.buttonPress();
    // We'll navigate to a page that we can create later.
    this.navCtrl.navigateForward('/initiate-pint');
  }

  /**
   * @description
   * Navigates to the details of a specific pint session.
   * @param pintId The ID of the pint session to view.
   */
  async viewPintSession(pintId: string): Promise<void> {
    console.log('Viewing pint session:', pintId);
    await this.hapticService.selection();
    // Navigate to a details page, passing the ID as a parameter.
    this.navCtrl.navigateForward(`/pint-details/${pintId}`);
  }

  /**
   * @description
   * Navigates to the user's own profile page.
   */
  async goToProfile(): Promise<void> {
    console.log('Navigating to profile page...');
    await this.hapticService.buttonPress();
    this.navCtrl.navigateForward('/profile');
  }

  /**
   * @description
   * Refreshes the session list.
   */
  async refreshSessions(event?: any): Promise<void> {
    await this.loadSessions();
    if (event) {
      event.target.complete();
    }
  }

  /**
   * @description
   * Logs out the current user.
   */
  async logout(): Promise<void> {
    await this.authService.clearAuthenticationState();
    this.navCtrl.navigateRoot('/login');
  }

  /**
   * @description
   * Helper method to calculate time ago from a timestamp.
   */
  getTimeAgo(timestamp: string): string {
    const now = new Date();
    const sessionTime = new Date(timestamp);
    const diffMs = now.getTime() - sessionTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  /**
   * @description
   * TrackBy function for *ngFor optimization
   */
  trackPintById(index: number, pint: PintSession): string {
    return pint.id;
  }

  /**
   * @description
   * Generate accessible aria-label for pint sessions
   */
  getPintSessionAriaLabel(pint: PintSession): string {
    const privacy = pint.isPrivate ? 'Private' : 'Public';
    const featured = pint.isFeatured ? 'Featured' : '';
    const timeAgo = this.getTimeAgo(pint.createdAt);
    
    return `${featured} ${privacy} session at ${pint.pubName}, started by ${pint.initiator.displayName}, ${timeAgo}. Distance 0.3 miles.`.trim();
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
