// src/app/services/api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  profilePictureUrl?: string;
  // Add other fields as needed
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
  login(credentials: object): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials);
  }

  /**
   * Registers a new user.
   * @param userData An object with email, password, and displayName.
   * @returns Observable with the auth token and user data.
   */
  register(userData: object): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, userData);
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

    return this.http.get<PintSession[]>(`${this.apiUrl}/sessions/nearby`, { params });
  }

  /**
   * Fetches the detailed information for a single pint session.
   * @param sessionId The ID of the session.
   * @returns Observable with the PintSession data, including attendees.
   */
  getSessionDetails(sessionId: string): Observable<PintSession> {
    return this.http.get<PintSession>(`${this.apiUrl}/sessions/${sessionId}`);
  }

  /**
   * Creates a new pint session.
   * @param sessionData An object with pubName, eta, and location.
   * @returns Observable with the newly created session data.
   */
  createSession(sessionData: object): Observable<PintSession> {
    return this.http.post<PintSession>(`${this.apiUrl}/sessions`, sessionData);
  }

  /**
   * Joins the current user to a pint session.
   * The API knows who the user is from the auth token.
   * @param sessionId The ID of the session to join.
   * @returns Observable with a success message.
   */
  joinSession(sessionId: string): Observable<{ message: string }> {
    // The body is empty because the server gets the userId from the auth token
    return this.http.post<{ message: string }>(`${this.apiUrl}/sessions/${sessionId}/attendees`, {});
  }
}