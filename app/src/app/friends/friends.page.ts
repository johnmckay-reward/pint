import { Component, OnInit, inject } from '@angular/core';
import { ApiService, User, Friendship, FriendsResponse, FriendRequestsResponse, UserSearchResponse } from '../services/api.service';
import { ToastController, AlertController, LoadingController } from '@ionic/angular';
import { HapticService } from '../services/haptic.service';
import { AccessibilityService } from '../services/accessibility.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject, of } from 'rxjs';

@Component({
  selector: 'app-friends',
  templateUrl: './friends.page.html',
  styleUrls: ['./friends.page.scss'],
  standalone: false
})
export class FriendsPage implements OnInit {
  private apiService = inject(ApiService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private loadingController = inject(LoadingController);
  private hapticService = inject(HapticService);
  private accessibilityService = inject(AccessibilityService);

  
  friends: User[] = [];
  sentRequests: Friendship[] = [];
  receivedRequests: Friendship[] = [];
  searchResults: User[] = [];
  
  searchQuery = '';
  activeTab = 'friends'; // 'friends', 'requests', 'search'
  isLoading = false;
  isSearching = false;
  
  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.loadData();
    this.setupSearch();
  }

  /**
   * Load friends and friend requests
   */
  async loadData() {
    this.isLoading = true;
    this.accessibilityService.announceLoading('Loading friends');
    
    try {
      // Load friends
      const friendsResponse = await this.apiService.getFriends().toPromise();
      if (friendsResponse) {
        this.friends = friendsResponse.friends;
      }

      // Load friend requests
      const requestsResponse = await this.apiService.getFriendRequests().toPromise();
      if (requestsResponse) {
        this.sentRequests = requestsResponse.sentRequests;
        this.receivedRequests = requestsResponse.receivedRequests;
      }

      this.accessibilityService.announceSuccess(
        `Loaded ${this.friends.length} friends and ${this.receivedRequests.length} requests`
      );
    } catch (error) {
      console.error('Error loading friends data:', error);
      this.accessibilityService.announceError('Failed to load friends data');
      this.showToast('Failed to load friends data', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Setup search with debouncing
   */
  setupSearch() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.length < 2) {
          return of({ users: [], count: 0, query: '' });
        }
        return this.apiService.searchUsers(query);
      })
    ).subscribe({
      next: (response) => {
        this.searchResults = response.users;
        this.isSearching = false;
      },
      error: (error) => {
        console.error('Search error:', error);
        this.isSearching = false;
        this.showToast('Search failed', 'danger');
      }
    });
  }

  /**
   * Handle tab change
   */
  onTabChange(event: any) {
    this.activeTab = String(event.detail.value) || 'friends';
  }

  /**
   * Handle search input
   */
  onSearchInput(event: any) {
    const query = event.target.value;
    this.searchQuery = query;
    
    if (query && query.length >= 2) {
      this.isSearching = true;
      this.searchSubject.next(query);
    } else {
      this.searchResults = [];
      this.isSearching = false;
    }
  }

  /**
   * Send friend request
   */
  async sendFriendRequest(user: User) {
    await this.hapticService.impact('light');
    
    const loading = await this.loadingController.create({
      message: 'Sending friend request...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const response = await this.apiService.sendFriendRequest(user.id).toPromise();
      if (response) {
        await this.hapticService.notification('success');
        this.accessibilityService.announceSuccess(`Friend request sent to ${user.displayName}`);
        this.showToast(`Friend request sent to ${user.displayName}`, 'success');
        // Remove from search results
        this.searchResults = this.searchResults.filter(u => u.id !== user.id);
        // Refresh data to show in sent requests
        await this.loadData();
      }
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      await this.hapticService.notification('error');
      const message = error.error?.error || 'Failed to send friend request';
      this.showToast(message, 'danger');
    } finally {
      loading.dismiss();
    }
  }

  /**
   * Respond to friend request
   */
  async respondToRequest(request: Friendship, action: 'accept' | 'decline') {
    await this.hapticService.impact('medium');
    
    const loading = await this.loadingController.create({
      message: `${action === 'accept' ? 'Accepting' : 'Declining'} request...`,
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const response = await this.apiService.respondToFriendRequest(request.id, action).toPromise();
      if (response) {
        await this.hapticService.notification(action === 'accept' ? 'success' : 'warning');
        const userName = request.requester?.displayName || 'User';
        this.accessibilityService.announceSuccess(`Friend request ${action}ed from ${userName}`);
        this.showToast(`Friend request ${action}ed`, 'success');
        // Refresh data
        await this.loadData();
      }
    } catch (error: any) {
      console.error('Error responding to friend request:', error);
      await this.hapticService.notification('error');
      const message = error.error?.error || 'Failed to respond to request';
      this.showToast(message, 'danger');
    } finally {
      loading.dismiss();
    }
  }

  /**
   * Show confirmation dialog for friend request response
   */
  async confirmResponse(request: Friendship, action: 'accept' | 'decline') {
    const userName = request.requester?.displayName || 'this user';
    const alert = await this.alertController.create({
      header: `${action === 'accept' ? 'Accept' : 'Decline'} Friend Request`,
      message: `Are you sure you want to ${action} the friend request from ${userName}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: action === 'accept' ? 'Accept' : 'Decline',
          handler: () => {
            this.respondToRequest(request, action);
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Refresh data
   */
  async doRefresh(event: any) {
    await this.loadData();
    event.target.complete();
  }

  /**
   * Check if user is already a friend
   */
  isAlreadyFriend(userId: string): boolean {
    return this.friends.some(friend => friend.id === userId);
  }

  /**
   * Check if friend request already sent
   */
  isRequestSent(userId: string): boolean {
    return this.sentRequests.some(request => request.addresseeId === userId);
  }

  /**
   * Show toast message
   */
  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color
    });
    toast.present();
  }
}
