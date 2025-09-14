import { Injectable, inject } from '@angular/core';
import { Observable, from, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  DocumentReference,
  CollectionReference,
  QueryConstraint,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Timestamp,
  GeoPoint
} from '@angular/fire/firestore';
import { geohashForLocation, geohashQueryBounds, distanceBetween } from 'geofire-common';
import { FirebaseAuthService, PintUser } from './firebase-auth.service';

// Firestore document interfaces
export interface PintSessionDoc {
  id?: string;
  pubName: string;
  eta: string;
  location: GeoPoint;
  geohash: string;
  initiatorId: string;
  attendeeIds: string[];
  createdAt: Timestamp;
  isPrivate: boolean;
  isFeatured?: boolean;
  pubId?: string;
}

export interface PubDoc {
  id?: string;
  name: string;
  address?: string;
  location?: GeoPoint;
  partnershipTier: 'none' | 'basic' | 'premium';
  ownerId?: string;
  createdAt: Timestamp;
}

export interface FriendshipDoc {
  id?: string;
  requesterId: string;
  addresseeId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Timestamp;
}

export interface ChatMessageDoc {
  id?: string;
  content: string;
  senderId: string;
  sessionId: string;
  createdAt: Timestamp;
}

export interface AchievementDoc {
  id?: string;
  name: string;
  description: string;
  iconUrl: string;
  key: string;
  pointValue: number;
}

// Response interfaces (populated with user data)
export interface PintSession extends Omit<PintSessionDoc, 'initiatorId' | 'attendeeIds' | 'location' | 'createdAt'> {
  id: string; // Make id required
  initiator: PintUser;
  attendees: PintUser[];
  location: { lat: number; lng: number };
  createdAt: string;
  pub?: PubDoc;
}

export interface ChatMessage extends Omit<ChatMessageDoc, 'senderId' | 'createdAt'> {
  sender: PintUser;
  createdAt: string;
}

export interface Friendship extends Omit<FriendshipDoc, 'requesterId' | 'addresseeId' | 'createdAt'> {
  requester?: PintUser;
  addressee?: PintUser;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private firestore = inject(Firestore);
  private authService = inject(FirebaseAuthService);

  // Collection references
  private usersCollection = collection(this.firestore, 'users');
  private sessionsCollection = collection(this.firestore, 'pintSessions');
  private pubsCollection = collection(this.firestore, 'pubs');
  private friendshipsCollection = collection(this.firestore, 'friendships');
  private achievementsCollection = collection(this.firestore, 'achievements');

  // User operations
  async getUserProfile(userId: string): Promise<PintUser | null> {
    const userRef = doc(this.usersCollection, userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data() as PintUser : null;
  }

  // Pint Session operations
  async createSession(sessionData: {
    pubName: string;
    eta: string;
    location: { lat: number; lng: number };
    isPrivate?: boolean;
  }): Promise<string> {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to create a session');
    }

    const geohash = geohashForLocation([sessionData.location.lat, sessionData.location.lng]);
    
    const newSession: Omit<PintSessionDoc, 'id'> = {
      pubName: sessionData.pubName,
      eta: sessionData.eta,
      location: new GeoPoint(sessionData.location.lat, sessionData.location.lng),
      geohash,
      initiatorId: currentUser.id,
      attendeeIds: [currentUser.id], // Initiator automatically joins
      createdAt: serverTimestamp() as Timestamp,
      isPrivate: sessionData.isPrivate || false
    };

    const docRef = await addDoc(this.sessionsCollection, newSession);
    return docRef.id;
  }

  async joinSession(sessionId: string): Promise<void> {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to join a session');
    }

    const sessionRef = doc(this.sessionsCollection, sessionId);
    await updateDoc(sessionRef, {
      attendeeIds: arrayUnion(currentUser.id)
    });
  }

  async leaveSession(sessionId: string): Promise<void> {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to leave a session');
    }

    const sessionRef = doc(this.sessionsCollection, sessionId);
    await updateDoc(sessionRef, {
      attendeeIds: arrayRemove(currentUser.id)
    });
  }

  // Get nearby sessions using geohashing
  getNearbySessions(location: { lat: number; lng: number }, radiusInKm: number = 5): Observable<PintSession[]> {
    const center: [number, number] = [location.lat, location.lng];
    const radiusInM = radiusInKm * 1000;
    
    // Get geohash query bounds
    const bounds = geohashQueryBounds(center, radiusInM);
    
    // Create queries for each geohash bound
    const queries = bounds.map(bound => {
      return query(
        this.sessionsCollection,
        where('geohash', '>=', bound[0]),
        where('geohash', '<=', bound[1]),
        orderBy('geohash'),
        orderBy('createdAt', 'desc')
      );
    });

    // Execute all queries and combine results
    return from(Promise.all(queries.map(q => getDocs(q)))).pipe(
      map(snapshots => {
        const allDocs: PintSessionDoc[] = [];
        snapshots.forEach(snapshot => {
          snapshot.forEach(doc => {
            const data = { id: doc.id, ...doc.data() } as PintSessionDoc;
            // Filter by actual distance to ensure accuracy
            const docLocation: [number, number] = [data.location.latitude, data.location.longitude];
            const distance = distanceBetween(center, docLocation);
            if (distance <= radiusInM) {
              allDocs.push(data);
            }
          });
        });
        
        // Remove duplicates and sort by creation time
        const uniqueDocs = allDocs.filter((doc, index, arr) => 
          arr.findIndex(d => d.id === doc.id) === index
        );
        
        return uniqueDocs.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
      }),
      switchMap(sessionDocs => this.populateSessionsWithUserData(sessionDocs))
    );
  }

  // Get all sessions (for dashboard)
  getAllSessions(): Observable<PintSession[]> {
    const sessionsQuery = query(this.sessionsCollection, orderBy('createdAt', 'desc'), limit(50));
    
    return new Observable(observer => {
      const unsubscribe = onSnapshot(sessionsQuery, (snapshot) => {
        const sessionDocs = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as PintSessionDoc));
        
        this.populateSessionsWithUserData(sessionDocs).subscribe(sessions => {
          observer.next(sessions);
        });
      });
      
      return () => unsubscribe();
    });
  }

  // Get session details
  getSessionDetails(sessionId: string): Observable<PintSession | null> {
    const sessionRef = doc(this.sessionsCollection, sessionId);
    
    return new Observable(observer => {
      const unsubscribe = onSnapshot(sessionRef, async (snapshot) => {
        if (snapshot.exists()) {
          const sessionDoc = { id: snapshot.id, ...snapshot.data() } as PintSessionDoc;
          const sessions = await this.populateSessionsWithUserData([sessionDoc]).toPromise();
          observer.next(sessions?.[0] || null);
        } else {
          observer.next(null);
        }
      });
      
      return () => unsubscribe();
    });
  }

  // Helper method to populate sessions with user data
  private populateSessionsWithUserData(sessionDocs: PintSessionDoc[]): Observable<PintSession[]> {
    if (sessionDocs.length === 0) {
      return from([[]]);
    }

    // Get all unique user IDs
    const allUserIds = new Set<string>();
    sessionDocs.forEach(session => {
      allUserIds.add(session.initiatorId);
      session.attendeeIds.forEach(id => allUserIds.add(id));
    });

    // Fetch all users
    const userPromises = Array.from(allUserIds).map(id => this.getUserProfile(id));
    
    return from(Promise.all(userPromises)).pipe(
      map(users => {
        const userMap = new Map<string, PintUser>();
        users.forEach(user => {
          if (user) userMap.set(user.id, user);
        });

        return sessionDocs.map(sessionDoc => ({
          id: sessionDoc.id,
          pubName: sessionDoc.pubName,
          eta: sessionDoc.eta,
          location: {
            lat: sessionDoc.location.latitude,
            lng: sessionDoc.location.longitude
          },
          geohash: sessionDoc.geohash,
          initiator: userMap.get(sessionDoc.initiatorId)!,
          attendees: sessionDoc.attendeeIds.map(id => userMap.get(id)!).filter(Boolean),
          createdAt: sessionDoc.createdAt.toDate().toISOString(),
          isPrivate: sessionDoc.isPrivate,
          isFeatured: sessionDoc.isFeatured
        } as PintSession));
      })
    );
  }

  // Chat operations
  async sendMessage(sessionId: string, content: string): Promise<void> {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to send messages');
    }

    const messagesCollection = collection(this.firestore, `pintSessions/${sessionId}/messages`);
    await addDoc(messagesCollection, {
      content,
      senderId: currentUser.id,
      sessionId,
      createdAt: serverTimestamp()
    });
  }

  getSessionMessages(sessionId: string, limitCount: number = 50): Observable<ChatMessage[]> {
    const messagesCollection = collection(this.firestore, `pintSessions/${sessionId}/messages`);
    const messagesQuery = query(messagesCollection, orderBy('createdAt', 'desc'), limit(limitCount));
    
    return new Observable(observer => {
      const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
        const messageDocs = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as ChatMessageDoc));

        // Get unique sender IDs and fetch user data
        const senderIds = [...new Set(messageDocs.map(msg => msg.senderId))];
        const senderPromises = senderIds.map(id => this.getUserProfile(id));
        const senders = await Promise.all(senderPromises);
        
        const senderMap = new Map<string, PintUser>();
        senders.forEach(sender => {
          if (sender) senderMap.set(sender.id, sender);
        });

        const messages: ChatMessage[] = messageDocs.map(msg => ({
          id: msg.id,
          content: msg.content,
          sessionId: msg.sessionId,
          sender: senderMap.get(msg.senderId)!,
          createdAt: msg.createdAt.toDate().toISOString()
        })).reverse(); // Reverse to show oldest first

        observer.next(messages);
      });
      
      return () => unsubscribe();
    });
  }

  // Friend operations
  async sendFriendRequest(addresseeId: string): Promise<void> {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to send friend requests');
    }

    // Check if friendship already exists
    const existingQuery = query(
      this.friendshipsCollection,
      where('requesterId', '==', currentUser.id),
      where('addresseeId', '==', addresseeId)
    );
    
    const existing = await getDocs(existingQuery);
    if (!existing.empty) {
      throw new Error('Friend request already sent');
    }

    await addDoc(this.friendshipsCollection, {
      requesterId: currentUser.id,
      addresseeId,
      status: 'pending',
      createdAt: serverTimestamp()
    });
  }

  async respondToFriendRequest(requestId: string, action: 'accept' | 'decline'): Promise<void> {
    const requestRef = doc(this.friendshipsCollection, requestId);
    await updateDoc(requestRef, {
      status: action === 'accept' ? 'accepted' : 'declined'
    });
  }

  getFriends(): Observable<PintUser[]> {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      return from([[]]);
    }

    const friendsQuery = query(
      this.friendshipsCollection,
      where('status', '==', 'accepted')
    );

    return new Observable(observer => {
      const unsubscribe = onSnapshot(friendsQuery, async (snapshot) => {
        const friendshipDocs = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as FriendshipDoc));

        // Get friend user IDs (exclude current user)
        const friendIds = friendshipDocs
          .filter(f => f.requesterId === currentUser.id || f.addresseeId === currentUser.id)
          .map(f => f.requesterId === currentUser.id ? f.addresseeId : f.requesterId);

        const friendPromises = friendIds.map(id => this.getUserProfile(id));
        const friends = await Promise.all(friendPromises);
        
        observer.next(friends.filter(Boolean) as PintUser[]);
      });
      
      return () => unsubscribe();
    });
  }

  // Search users
  async searchUsers(searchQuery: string): Promise<PintUser[]> {
    // Note: Firestore doesn't have full-text search, so this is a simple implementation
    // In production, you might want to use Algolia or similar service
    const usersQuery = query(this.usersCollection, limit(20));
    const snapshot = await getDocs(usersQuery);
    
    const users = snapshot.docs.map(doc => doc.data() as PintUser);
    return users.filter(user => 
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
}