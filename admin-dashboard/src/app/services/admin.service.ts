import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: string;
  };
}

export interface Analytics {
  users: {
    total: number;
    newThisWeek: number;
  };
  sessions: {
    total: number;
    active: number;
  };
  pubs: {
    totalOwners: number;
    pendingClaims: number;
  };
  messages: {
    total: number;
    thisWeek: number;
  };
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  favouriteTipple?: string;
  role: string;
  subscriptionTier: string;
  createdAt: string;
}

export interface PubClaim {
  id: string;
  pubName: string;
  pubAddress: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials);
  }

  getAnalytics(): Observable<Analytics> {
    return this.http.get<Analytics>(`${this.apiUrl}/admin/analytics`);
  }

  getUsers(page: number = 1, limit: number = 20): Observable<{users: User[], pagination: any}> {
    return this.http.get<{users: User[], pagination: any}>(`${this.apiUrl}/admin/users?page=${page}&limit=${limit}`);
  }

  suspendUser(userId: string, suspended: boolean, reason?: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admin/users/${userId}/suspend`, { suspended, reason });
  }

  getPubClaims(): Observable<PubClaim[]> {
    return this.http.get<PubClaim[]>(`${this.apiUrl}/admin/pub-claims`);
  }

  approvePubClaim(claimId: string, approved: boolean, rejectionReason?: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admin/pub-claims/${claimId}/approve`, { approved, rejectionReason });
  }

  getReportedContent(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/reported-content`);
  }

  deleteMessage(messageId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/messages/${messageId}`);
  }
}