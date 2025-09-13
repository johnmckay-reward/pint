// src/app/services/api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { Preferences } from '@capacitor/preferences';

// Define the structure of the authentication response
export interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: string;
    displayName: string;
    email: string;
  };
}

// Define the structures for our data (optional, but good practice)
export interface User {
  id: string;
  displayName: string;
  email: string;
  favouriteTipple?: string;
  profilePictureUrl?: string;
}

export interface PintSession {
  id: string;
  pubName: string;
  eta: string;
  location: any;
  initiator: User;
  attendees?: User[];
  createdAt: string;
}

export interface CreateSessionRequest {
  pubName: string;
  eta: string;
  location: { lat: number; lng: number };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  favouriteTipple?: string;
  profilePictureUrl?: string;
}


@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // The base URL of your Express API
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  /**
   * Logs a user in.
   * @param credentials An object with email and password.
   * @returns Observable with the auth token and user data.
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/auth/login`, credentials).pipe(
      tap(async (response: AuthResponse) => {
        await Preferences.set({
          key: 'authResponse',
          value: JSON.stringify(response)
        });
      })
    );
  }

  /**
   * Registers a new user.
   * @param userData An object with email, password, and displayName.
   * @returns Observable with the auth token and user data.
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/auth/register`, userData).pipe(
      tap(async (response: AuthResponse) => {
        await Preferences.set({
          key: 'authResponse',
          value: JSON.stringify(response)
        });
      })
    );
  }

  /**
   * Gets the current user's profile.
   * @returns Observable with the user profile data.
   */
  getUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/api/users/me`);
  }

  /**
   * Logs out the current user by removing stored auth data.
   */
  async logout(): Promise<void> {
    await Preferences.remove({ key: 'authResponse' });
  }

  /**
   * Gets the stored authentication response.
   * @returns Promise with the stored auth response or null.
   */
  async getStoredAuthResponse(): Promise<AuthResponse | null> {
    try {
      const { value } = await Preferences.get({ key: 'authResponse' });
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  /**
   * Fetches pint sessions near a specific location.
   * @param location An object with lat and lng.
   * @param radius The search radius in meters.
   * @returns Observable array of PintSessions.
   */
  getNearbySessions(location: { lat: number, lng: number }, radius: number): Observable<PintSession[]> {
    const params = new HttpParams()
      .set('lat', location.lat.toString())
      .set('lng', location.lng.toString())
      .set('radius', radius.toString());

    return this.http.get<PintSession[]>(`${this.apiUrl}/api/sessions/nearby`, { params });
  }

  /**
   * Fetches all pint sessions.
   * @returns Observable array of PintSessions.
   */
  getAllSessions(): Observable<PintSession[]> {
    return this.http.get<PintSession[]>(`${this.apiUrl}/api/sessions`);
  }

  /**
   * Fetches the detailed information for a single pint session.
   * @param sessionId The ID of the session.
   * @returns Observable with the PintSession data, including attendees.
   */
  getSessionDetails(sessionId: string): Observable<PintSession> {
    return this.http.get<PintSession>(`${this.apiUrl}/api/sessions/${sessionId}`);
  }

  /**
   * Creates a new pint session.
   * @param sessionData An object with pubName, eta, and location.
   * @returns Observable with the newly created session data.
   */
  createSession(sessionData: CreateSessionRequest): Observable<PintSession> {
    return this.http.post<PintSession>(`${this.apiUrl}/api/sessions`, sessionData);
  }

  /**
   * Joins the current user to a pint session.
   * The API knows who the user is from the auth token.
   * @param sessionId The ID of the session to join.
   * @returns Observable with a success message.
   */
  joinSession(sessionId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/api/sessions/${sessionId}/join`, {});
  }
}