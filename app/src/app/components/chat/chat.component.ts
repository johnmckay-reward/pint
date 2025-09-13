import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ChatService, ChatMessage, ChatUser } from '../../services/chat.service';
import { ApiService, ChatMessagesResponse } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  standalone: false
})
export class ChatComponent implements OnInit, OnDestroy {
  @Input() sessionId!: string;
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;

  messages: ChatMessage[] = [];
  newMessage = '';
  isConnected = false;
  isLoading = true;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private chatService: ChatService,
    private apiService: ApiService,
    private authService: AuthService,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    if (!this.sessionId) {
      console.error('Session ID is required for chat component');
      return;
    }

    await this.initializeChat();
    this.setupSubscriptions();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.chatService.leaveSessionRoom(this.sessionId);
    this.chatService.disconnect();
  }

  /**
   * Initialize chat connection and load historical messages
   */
  private async initializeChat() {
    try {
      // Connect to chat server
      await this.chatService.connect();
      
      // Load historical messages
      await this.loadMessages();
      
      // Join the session room
      this.chatService.joinSessionRoom(this.sessionId);
      
      this.isLoading = false;
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      this.isLoading = false;
      this.showToast('Failed to connect to chat', 'danger');
    }
  }

  /**
   * Set up subscriptions to chat events
   */
  private setupSubscriptions() {
    // Subscribe to new messages
    this.subscriptions.push(
      this.chatService.messages$.subscribe(message => {
        this.messages.push(message);
        this.scrollToBottom();
      })
    );

    // Subscribe to connection status
    this.subscriptions.push(
      this.chatService.connected$.subscribe(connected => {
        this.isConnected = connected;
        if (!connected) {
          this.showToast('Disconnected from chat', 'warning');
        }
      })
    );

    // Subscribe to errors
    this.subscriptions.push(
      this.chatService.error$.subscribe(error => {
        this.showToast(error, 'danger');
      })
    );

    // Subscribe to user join/leave events
    this.subscriptions.push(
      this.chatService.userJoined$.subscribe(user => {
        this.showToast(`${user.displayName} joined the chat`, 'light');
      })
    );

    this.subscriptions.push(
      this.chatService.userLeft$.subscribe(user => {
        this.showToast(`${user.displayName} left the chat`, 'light');
      })
    );
  }

  /**
   * Load historical messages from the API
   */
  private async loadMessages() {
    try {
      const response = await this.apiService.getSessionMessages(this.sessionId).toPromise();
      if (response?.messages) {
        this.messages = response.messages;
        setTimeout(() => this.scrollToBottom(), 100);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      this.showToast('Failed to load chat history', 'warning');
    }
  }

  /**
   * Send a new message
   */
  sendMessage() {
    if (!this.newMessage.trim() || !this.isConnected) {
      return;
    }

    this.chatService.sendMessage(this.sessionId, this.newMessage);
    this.newMessage = '';
  }

  /**
   * Handle Enter key press in message input
   */
  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Check if message is from current user
   */
  isOwnMessage(message: ChatMessage): boolean {
    return message.sender.id === this.authService.currentUser?.id;
  }

  /**
   * Get display time for message
   */
  getMessageTime(message: ChatMessage): string {
    const date = new Date(message.createdAt);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Scroll to bottom of messages container
   */
  private scrollToBottom() {
    setTimeout(() => {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    }, 50);
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
