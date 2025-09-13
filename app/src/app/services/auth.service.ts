import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService, AuthResponse, User } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.checkAuthStatus();
  }

  /**
   * Check if user is currently authenticated by looking for stored auth data
   */
  private async checkAuthStatus(): Promise<void> {
    const authResponse = await this.apiService.getStoredAuthResponse();
    if (authResponse) {
      this.isAuthenticatedSubject.next(true);
      this.currentUserSubject.next(authResponse.user);
    }
  }

  /**
   * Set authentication state after successful login/register
   */
  setAuthenticationState(authResponse: AuthResponse): void {
    this.isAuthenticatedSubject.next(true);
    this.currentUserSubject.next(authResponse.user);
  }

  /**
   * Clear authentication state on logout
   */
  async clearAuthenticationState(): Promise<void> {
    await this.apiService.logout();
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
  }

  /**
   * Get current authentication status
   */
  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Get current user data
   */
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }
}