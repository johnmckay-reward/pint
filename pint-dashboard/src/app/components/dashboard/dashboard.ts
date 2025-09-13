import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { PubOwner, Pub, PintSession, PubAnalytics } from '../../models/dashboard.models';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  currentUser: PubOwner | null = null;
  pub: Pub | null = null;
  sessions: PintSession[] = [];
  analytics: PubAnalytics | null = null;
  loading = true;
  error = '';

  // Pub search for claiming
  searchQuery = '';
  searchResults: Pub[] = [];
  searching = false;
  claiming = false;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.apiService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user?.pubId) {
        this.loadPubData();
      } else {
        this.loading = false;
      }
    });
  }

  async loadPubData(): Promise<void> {
    try {
      // Load pub details, sessions, and analytics
      const [pubResponse, sessionsResponse, analyticsResponse] = await Promise.all([
        this.apiService.getMyPub().toPromise(),
        this.apiService.getMySessions().toPromise(),
        this.apiService.getAnalytics().toPromise()
      ]);

      this.pub = pubResponse?.pub || null;
      this.sessions = sessionsResponse?.sessions || [];
      this.analytics = analyticsResponse?.analytics || null;
      this.loading = false;
    } catch (error: any) {
      this.error = 'Failed to load pub data';
      this.loading = false;
    }
  }

  searchPubs(): void {
    if (this.searchQuery.trim().length < 2) {
      return;
    }

    this.searching = true;
    this.apiService.searchPubs(this.searchQuery).subscribe({
      next: (response) => {
        this.searchResults = response.pubs;
        this.searching = false;
      },
      error: (error) => {
        this.error = 'Failed to search pubs';
        this.searching = false;
      }
    });
  }

  claimPub(pubId: string): void {
    this.claiming = true;
    this.apiService.claimPub(pubId).subscribe({
      next: (response) => {
        this.claiming = false;
        this.searchResults = [];
        this.searchQuery = '';
        this.loadPubData();
      },
      error: (error) => {
        this.error = error.error?.error || 'Failed to claim pub';
        this.claiming = false;
      }
    });
  }

  promoteSession(sessionId: string): void {
    this.apiService.promoteSession(sessionId).subscribe({
      next: (response) => {
        // Update the session in the list
        const sessionIndex = this.sessions.findIndex(s => s.id === sessionId);
        if (sessionIndex >= 0) {
          this.sessions[sessionIndex] = response.session;
        }
      },
      error: (error) => {
        this.error = error.error?.error || 'Failed to promote session';
      }
    });
  }

  logout(): void {
    this.apiService.logout();
    this.router.navigate(['/login']);
  }
}
