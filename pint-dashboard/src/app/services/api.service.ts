import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  PubOwner, 
  Pub, 
  PintSession, 
  PubAnalytics, 
  AuthResponse, 
  RegisterRequest, 
  LoginRequest 
} from '../models/dashboard.models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:3000/api';
  private currentUserSubject = new BehaviorSubject<PubOwner | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check for existing token on initialization
    const token = localStorage.getItem('partner_token');
    if (token) {
      // TODO: Validate token and load user data
    }
  }

  // Auth methods
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/partner/auth/register`, data)
      .pipe(
        tap(response => {
          localStorage.setItem('partner_token', response.token);
          this.currentUserSubject.next(response.pubOwner);
        })
      );
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/partner/auth/login`, data)
      .pipe(
        tap(response => {
          localStorage.setItem('partner_token', response.token);
          this.currentUserSubject.next(response.pubOwner);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('partner_token');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('partner_token');
  }

  // Pub management methods
  searchPubs(query: string): Observable<{ pubs: Pub[] }> {
    return this.http.get<{ pubs: Pub[] }>(`${this.apiUrl}/partner/pubs/search?q=${encodeURIComponent(query)}`, {
      headers: this.getAuthHeaders()
    });
  }

  claimPub(pubId: string): Observable<{ message: string; pubOwner: PubOwner }> {
    return this.http.post<{ message: string; pubOwner: PubOwner }>(`${this.apiUrl}/partner/pubs/${pubId}/claim`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => {
        this.currentUserSubject.next(response.pubOwner);
      })
    );
  }

  getMyPub(): Observable<{ pub: Pub }> {
    return this.http.get<{ pub: Pub }>(`${this.apiUrl}/partner/my-pub`, {
      headers: this.getAuthHeaders()
    });
  }

  updateMyPub(pubData: Partial<Pub>): Observable<{ message: string; pub: Pub }> {
    return this.http.put<{ message: string; pub: Pub }>(`${this.apiUrl}/partner/my-pub`, pubData, {
      headers: this.getAuthHeaders()
    });
  }

  // Session methods
  getMySessions(): Observable<{ sessions: PintSession[] }> {
    return this.http.get<{ sessions: PintSession[] }>(`${this.apiUrl}/partner/my-pub/sessions`, {
      headers: this.getAuthHeaders()
    });
  }

  promoteSession(sessionId: string): Observable<{ message: string; session: PintSession }> {
    return this.http.post<{ message: string; session: PintSession }>(`${this.apiUrl}/partner/sessions/${sessionId}/promote`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  // Analytics methods
  getAnalytics(): Observable<{ analytics: PubAnalytics }> {
    return this.http.get<{ analytics: PubAnalytics }>(`${this.apiUrl}/partner/my-pub/analytics`, {
      headers: this.getAuthHeaders()
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('partner_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
}