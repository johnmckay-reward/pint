import { Injectable, inject } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    displayName: string;
    profilePictureUrl?: string;
  };
}

export interface ChatUser {
  userId: string;
  displayName: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);

  private socket: Socket | null = null;
  private messagesSubject = new Subject<ChatMessage>();
  private userJoinedSubject = new Subject<ChatUser>();
  private userLeftSubject = new Subject<ChatUser>();
  private errorSubject = new Subject<string>();
  private connectedSubject = new BehaviorSubject<boolean>(false);

  // Public observables for components to subscribe to
  messages$ = this.messagesSubject.asObservable();
  userJoined$ = this.userJoinedSubject.asObservable();
  userLeft$ = this.userLeftSubject.asObservable();
  error$ = this.errorSubject.asObservable();
  connected$ = this.connectedSubject.asObservable();

  /**
   * Get stored authentication response (helper method)
   */
  private async getStoredAuthResponse() {
    return this.apiService.getStoredAuthResponse();
  }

  /**
   * Initialize socket connection with authentication
   */
  async connect(): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    try {
      const authResponse = await this.getStoredAuthResponse();
      if (!authResponse?.token) {
        throw new Error('No authentication token found');
      }

      this.socket = io('http://localhost:3000', {
        auth: {
          token: authResponse.token
        },
        autoConnect: false
      });

      this.setupSocketListeners();
      this.socket.connect();

    } catch (error) {
      console.error('Failed to connect to chat server:', error);
      this.errorSubject.next('Failed to connect to chat server');
    }
  }

  /**
   * Disconnect from socket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectedSubject.next(false);
    }
  }

  /**
   * Join a session's chat room
   */
  joinSessionRoom(sessionId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('joinSessionRoom', sessionId);
    } else {
      this.errorSubject.next('Not connected to chat server');
    }
  }

  /**
   * Leave a session's chat room
   */
  leaveSessionRoom(sessionId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leaveSessionRoom', sessionId);
    }
  }

  /**
   * Send a message to the current session
   */
  sendMessage(sessionId: string, content: string): void {
    if (!this.socket?.connected) {
      this.errorSubject.next('Not connected to chat server');
      return;
    }

    if (!content.trim()) {
      this.errorSubject.next('Message cannot be empty');
      return;
    }

    if (content.length > 1000) {
      this.errorSubject.next('Message is too long');
      return;
    }

    this.socket.emit('sendMessage', {
      sessionId,
      content: content.trim()
    });
  }

  /**
   * Set up socket event listeners
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to chat server');
      this.connectedSubject.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      this.connectedSubject.next(false);
    });

    this.socket.on('newMessage', (message: ChatMessage) => {
      this.messagesSubject.next(message);
    });

    this.socket.on('userJoinedChat', (user: ChatUser) => {
      this.userJoinedSubject.next(user);
    });

    this.socket.on('userLeftChat', (user: ChatUser) => {
      this.userLeftSubject.next(user);
    });

    this.socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error.message);
      this.errorSubject.next(error.message);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.errorSubject.next('Connection failed: ' + error.message);
      this.connectedSubject.next(false);
    });
  }
}