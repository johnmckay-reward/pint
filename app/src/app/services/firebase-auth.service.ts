import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { 
  Auth, 
  User as FirebaseUser, 
  signInWithPopup, 
  GoogleAuthProvider, 
  OAuthProvider,
  signOut,
  onAuthStateChanged,
  User
} from '@angular/fire/auth';
import { 
  Firestore, 
  doc, 
  setDoc, 
  getDoc, 
  DocumentReference 
} from '@angular/fire/firestore';

export interface PintUser {
  id: string;
  email: string;
  displayName: string;
  favouriteTipple?: string;
  profilePictureUrl?: string;
  subscriptionTier: 'free' | 'plus';
  role: 'user' | 'pub_owner' | 'admin';
  createdAt?: Date;
  lastLoginAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  private currentUserSubject = new BehaviorSubject<PintUser | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  public currentUser$: Observable<PintUser | null> = this.currentUserSubject.asObservable();
  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

  constructor() {
    this.initializeAuthStateListener();
  }

  private initializeAuthStateListener(): void {
    onAuthStateChanged(this.auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // User is signed in
        const pintUser = await this.createOrUpdateUserDocument(firebaseUser);
        this.currentUserSubject.next(pintUser);
        this.isAuthenticatedSubject.next(true);
      } else {
        // User is signed out
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);
      }
    });
  }

  private async createOrUpdateUserDocument(firebaseUser: FirebaseUser): Promise<PintUser> {
    const userRef: DocumentReference = doc(this.firestore, `users/${firebaseUser.uid}`);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // Update existing user's last login
      const userData = userSnap.data() as PintUser;
      await setDoc(userRef, {
        ...userData,
        lastLoginAt: new Date()
      }, { merge: true });
      
      return {
        ...userData,
        lastLoginAt: new Date()
      };
    } else {
      // Create new user document
      const newUser: PintUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'Anonymous User',
        profilePictureUrl: firebaseUser.photoURL || undefined,
        subscriptionTier: 'free',
        role: 'user',
        createdAt: new Date(),
        lastLoginAt: new Date()
      };

      await setDoc(userRef, newUser);
      return newUser;
    }
  }

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    // Request additional scopes if needed
    provider.addScope('profile');
    provider.addScope('email');
    
    try {
      await signInWithPopup(this.auth, provider);
      // User will be handled by the auth state listener
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  async signInWithApple(): Promise<void> {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    
    try {
      await signInWithPopup(this.auth, provider);
      // User will be handled by the auth state listener
    } catch (error) {
      console.error('Apple sign-in error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
      // State will be cleared by the auth state listener
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  }

  get currentUser(): PintUser | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  // Method to update user profile data
  async updateUserProfile(updates: Partial<PintUser>): Promise<void> {
    const currentUser = this.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    const userRef: DocumentReference = doc(this.firestore, `users/${currentUser.id}`);
    await setDoc(userRef, updates, { merge: true });
    
    // Update local state
    this.currentUserSubject.next({ ...currentUser, ...updates });
  }

  // Get Firebase ID token for API calls (if needed)
  async getIdToken(): Promise<string | null> {
    const user = this.auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  }
}