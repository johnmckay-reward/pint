# Copilot Instructions for Pint App

## Project Overview

Pint is a comprehensive social drinking platform that connects people through pub meetups. The platform consists of five integrated applications serving different user types: pub-goers, pub owners, and platform administrators.

## Architecture

### Tech Stack
- **Frontend**: Angular 20 + Ionic 8 (TypeScript)
- **Authentication**: Firebase Authentication (Google & Apple sign-in)
- **Database**: Cloud Firestore with real-time capabilities
- **Geospatial**: Geohashing with geofire-common for location queries
- **Mobile**: Capacitor for iOS/Android deployment
- **Admin**: Angular 20 (TypeScript)
- **Website**: Static HTML/CSS/JavaScript
- **Payments**: Minimal Node.js + Express API for Stripe integration

### Project Structure
```
/
├── app/                # Angular/Ionic user-facing application
│   ├── src/
│   │   ├── app/
│   │   │   ├── services/    # Firebase and business logic services
│   │   │   │   ├── firebase-auth.service.ts
│   │   │   │   └── firestore.service.ts
│   │   │   └── [pages]/     # Ionic page components
│   │   ├── environments/    # Firebase configuration
│   │   └── theme/           # Global styles and theming
├── api/                # Minimal Node.js/Express API (payments/admin)
│   ├── routes/         # Express route handlers
│   │   ├── payments.js # Stripe payment processing
│   │   └── admin.js    # Admin-only server functions
│   └── middleware/     # Authentication and authorization
├── pint-dashboard/     # Angular partner dashboard for pub owners
│   ├── src/
│   │   ├── app/
│   │   │   ├── services/    # Firebase services
│   │   │   └── [pages]/     # Dashboard pages
│   │   ├── environments/    # Firebase configuration
│   │   └── assets/          # Partner-specific assets
├── admin-dashboard/    # Angular admin dashboard for platform management
│   ├── src/
│   │   ├── app/
│   │   │   ├── services/    # Firebase admin services
│   │   │   └── pages/       # Admin dashboard pages
│   │   ├── environments/    # Firebase configuration
│   │   └── assets/          # Admin-specific assets
├── website/            # Marketing website and pub onboarding
│   ├── index.html      # Main landing page
│   └── pubs.html       # Pub partner onboarding page
└── firestore.rules     # Firestore security rules
```

## Application Purposes

### User App (`/app`)
- Primary mobile/web application for pub-goers
- Features: Create/join pint sessions, find pubs, chat, achievements
- Target users: General public looking to socialize at pubs
- Technology: Angular + Ionic for mobile-first experience

### Partner Dashboard (`/pint-dashboard`)
- Business dashboard for pub owners and managers
- Features: Claim pub ownership, view analytics, manage pub profile
- Target users: Pub owners, bar managers, hospitality businesses
- Technology: Angular web application

### Admin Dashboard (`/admin-dashboard`)
- Internal platform management interface
- Features: User management, pub approval, analytics, content moderation
- Target users: Platform administrators and support staff
- Technology: Angular web application with role-based access

### Marketing Website (`/website`)
- Public-facing marketing and onboarding site
- Features: Product information, waitlist signup, partner onboarding
- Target users: Potential customers and business partners
- Technology: Static HTML/CSS/JavaScript

### API (`/api`)
- Minimal backend for server-side functions
- Features: Payment processing (Stripe), admin server functions
- Serves: Payment webhooks, admin-only server operations
- Technology: Node.js + Express (minimal footprint)

## Core Data Models (Firestore)

### Users Collection (`users/{userId}`)
```typescript
interface PintUser {
  id: string;                    // Firebase Auth UID
  email: string;                 // From Firebase Auth
  displayName: string;           // User's display name
  favouriteTipple?: string;      // Preferred drink
  profilePictureUrl?: string;    // Profile image URL
  subscriptionTier: 'free' | 'plus';
  role: 'user' | 'pub_owner' | 'admin';
  createdAt: Date;
  lastLoginAt: Date;
}
```

### PintSessions Collection (`pintSessions/{sessionId}`)
```typescript
interface PintSessionDoc {
  id: string;                    // Auto-generated Firestore ID
  pubName: string;               // Name of the pub
  eta: string;                   // Estimated time of arrival
  location: GeoPoint;            // Firestore GeoPoint
  geohash: string;               // For geospatial queries
  initiatorId: string;           // User ID who created session
  attendeeIds: string[];         // Array of user IDs
  createdAt: Timestamp;          // Firestore timestamp
  isPrivate: boolean;
  isFeatured?: boolean;
  pubId?: string;                // Reference to pub document
}
```

### Chat Messages SubCollection (`pintSessions/{sessionId}/messages/{messageId}`)
```typescript
interface ChatMessageDoc {
  id: string;                    // Auto-generated ID
  content: string;               // Message content
  senderId: string;              // User ID of sender
  sessionId: string;             // Parent session ID
  createdAt: Timestamp;          // When message was sent
}
```

### Friendships Collection (`friendships/{friendshipId}`)
```typescript
interface FriendshipDoc {
  id: string;                    // Auto-generated ID
  requesterId: string;           // User who sent request
  addresseeId: string;           // User who received request
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Timestamp;
}
```

### Pubs Collection (`pubs/{pubId}`)
```typescript
interface PubDoc {
  id: string;                    // Auto-generated ID
  name: string;                  // Pub name
  address?: string;              // Physical address
  location?: GeoPoint;           // Geolocation
  partnershipTier: 'none' | 'basic' | 'premium';
  ownerId?: string;              // Reference to user
  createdAt: Timestamp;
}
```

### PubOwners Collection (`pubOwners/{ownerId}`)
```typescript
interface PubOwnerDoc {
  id: string;                    // Auto-generated ID
  userId: string;                // Reference to user
  pubName: string;               // Name of owned pub
  businessAddress: string;       // Business address
  status: 'pending' | 'approved' | 'rejected';
  verificationDetails: any;      // Business verification data
  createdAt: Timestamp;
}
```

### Achievements Collection (`achievements/{achievementId}`)
```typescript
interface AchievementDoc {
  id: string;                    // Auto-generated ID
  name: string;                  // Achievement name
  description: string;           // Achievement description
  iconUrl: string;               // Achievement icon
  key: string;                   // Unique achievement key
  pointValue: number;            // Points awarded
}
```

## Development Conventions

### Authentication Flow (Firebase)

**Authentication Service Pattern:**
```typescript
// FirebaseAuthService handles all authentication
signInWithGoogle(): Promise<void>
signInWithApple(): Promise<void>
signOut(): Promise<void>
currentUser$: Observable<PintUser | null>
isAuthenticated$: Observable<boolean>
```

**Authentication State Management:**
- Use Firebase Auth state listener for automatic session management
- No manual token storage required
- Role-based access controlled via Firestore user documents
- Social sign-in only (Google & Apple) - no email/password

### Data Access Patterns (Firestore)

**Service Structure:**
```typescript
// FirestoreService handles all data operations
createSession(data): Promise<string>
getNearbySessions(location, radius): Observable<PintSession[]>
getAllSessions(): Observable<PintSession[]>
sendMessage(sessionId, content): Promise<void>
getSessionMessages(sessionId): Observable<ChatMessage[]>
```

**Real-time Data Patterns:**
- Use Firestore observables for real-time updates
- Implement geohashing for location-based queries
- Use subcollections for related data (e.g., chat messages)
- Leverage Firestore's offline capabilities

### Frontend (Angular/Ionic)

**Component Structure:**
- Use Ionic page components (`@Component` with `selector: 'app-[name]'`)
- Follow suffix conventions: `Page` for pages, `Component` for reusable components
- Use kebab-case for selectors, camelCase for properties

**Services:**
- Use `FirebaseAuthService` for authentication
- Use `FirestoreService` for data operations
- Use RxJS Observables for real-time data streams
- Define TypeScript interfaces matching Firestore documents

**Styling:**
- Use SCSS for component styles
- Keep component styles under 2KB budget
- Follow Ionic theming conventions
- Use CSS custom properties for theming

**Routing:**
- Use Angular Router with lazy-loaded modules
- Each page should have its own module for code splitting
- Protected routes use Firebase Auth guards

### Geospatial Queries

**Location-based Session Discovery:**
```typescript
// Use geohashing for efficient location queries
const center: [number, number] = [lat, lng];
const geohash = geohashForLocation(center);
const bounds = geohashQueryBounds(center, radiusInMeters);

// Query Firestore with geohash bounds
const queries = bounds.map(bound => 
  query(collection, 
    where('geohash', '>=', bound[0]),
    where('geohash', '<=', bound[1])
  )
);
```

**Best Practices:**
- Use appropriate geohash precision for query area
- Filter results by actual distance for accuracy
- Implement caching for frequently accessed locations
- Use CSS custom properties for theming

**Routing:**
- Use Angular Router with lazy-loaded modules
- Each page should have its own module for code splitting

### Firestore Security Rules

**Role-based Access Control:**
```javascript
// Users can read any profile, but only edit their own
match /users/{userId} {
  allow read: if request.auth != null;
  allow create, update: if request.auth != null 
    && request.auth.uid == userId;
}

// Sessions are readable by all, editable by creator
match /pintSessions/{sessionId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null 
    && request.resource.data.initiatorId == request.auth.uid;
  allow update, delete: if request.auth != null 
    && resource.data.initiatorId == request.auth.uid;
}

// Admin-only collections
match /adminUsers/{adminId} {
  allow read, write: if request.auth != null && isAdmin();
}
```

**Helper Functions:**
```javascript
function isAdmin() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

function validateUserData(data) {
  return data.keys().hasAll(['id', 'email', 'displayName', 'role'])
    && data.id == request.auth.uid
    && data.email == request.auth.token.email;
}
```

### Error Handling

**Firebase Auth Errors:**
```typescript
catch (error: any) {
  switch (error.code) {
    case 'auth/popup-closed-by-user':
      this.handleUserCancellation();
      break;
    case 'auth/popup-blocked':
      this.handlePopupBlocked();
      break;
    default:
      this.handleGenericError(error);
  }
}
```

**Firestore Errors:**
```typescript
catch (error: any) {
  switch (error.code) {
    case 'permission-denied':
      this.handlePermissionDenied();
      break;
    case 'unavailable':
      this.handleOfflineMode();
      break;
    default:
      this.handleDataError(error);
  }
}
```

### API Endpoints (Minimal Express)

**Payment Processing:**
```javascript
// Stripe webhook endpoint
POST /api/payments/webhook
// Subscription management
POST /api/payments/create-checkout-session
GET /api/payments/portal-session
```

**Admin Functions:**
```javascript
// Server-side admin operations that can't be done client-side
POST /api/admin/bulk-operations
POST /api/admin/data-export
```

### Common Patterns

**Real-time Data Subscription:**
```typescript
// Service method pattern for real-time data
getSessionDetails(sessionId: string): Observable<PintSession | null> {
  const sessionRef = doc(this.firestore, `pintSessions/${sessionId}`);
  
  return new Observable(observer => {
    const unsubscribe = onSnapshot(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const sessionData = { id: snapshot.id, ...snapshot.data() };
        observer.next(this.populateSessionWithUserData(sessionData));
      } else {
        observer.next(null);
      }
    });
    
    return () => unsubscribe();
  });
}
```

**Geohash Query Pattern:**
```typescript
// Firestore geospatial query pattern
getNearbySessions(location: {lat: number, lng: number}, radius: number) {
  const center: [number, number] = [location.lat, location.lng];
  const bounds = geohashQueryBounds(center, radius * 1000);
  
  const queries = bounds.map(bound => 
    query(this.sessionsCollection,
      where('geohash', '>=', bound[0]),
      where('geohash', '<=', bound[1]),
      orderBy('geohash'),
      orderBy('createdAt', 'desc')
    )
  );
  
  return from(Promise.all(queries.map(q => getDocs(q))));
}
  - `isAdmin` - Restricts access to admin-only routes
  - Partner routes use standard authentication + role checking
- Store hashed passwords using bcrypt

**Location Features:**
- Use PostGIS GEOMETRY for location data
- Implement radius-based proximity searches
- Store coordinates as `{lat, lng}` objects in frontend

## Common Patterns

### API Communication
```typescript
// Service method pattern
methodName(params: Type): Observable<ResponseType> {
  return this.http.post<ResponseType>(`${this.apiUrl}/endpoint`, params);
}
```

### Database Models
```javascript
// Sequelize model pattern
const Model = sequelize.define('ModelName', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  }
  // ... other fields
}, {
  tableName: 'table_name'
});
```

### Error Handling
- Use try/catch blocks in async functions
- Return appropriate HTTP status codes
- Provide meaningful error messages
- Log errors for debugging

## Build and Development

### Frontend Commands (User App)
```bash
cd app/
npm install
npm run start    # Development server
npm run build    # Production build
npm run lint     # ESLint checking
npm run test     # Karma/Jasmine tests
```

### Partner Dashboard Commands
```bash
cd pint-dashboard/
npm install
npm run start    # Development server (typically port 4200)
npm run build    # Production build
```

### Admin Dashboard Commands
```bash
cd admin-dashboard/
npm install
npm run start    # Development server (typically port 4201)
npm run build    # Production build
```

### Backend Commands
```bash
cd api/
npm install
node index.js    # Start server (development)
```

### Database Setup
- PostgreSQL with PostGIS extension required
- Environment variables for database connection
- Sequelize handles schema migrations and seeding

## Code Quality

### Linting
- ESLint configured for Angular projects
- TypeScript strict mode enabled
- Follow Angular Style Guide conventions

### Testing
- Karma + Jasmine for frontend unit tests
- Test files use `.spec.ts` extension
- Place tests alongside source files

## Security Considerations

- Never commit secrets or API keys
- Use environment variables for configuration
- Implement proper authentication middleware
- Validate all user inputs
- Use HTTPS in production

## Mobile Considerations

- App uses Capacitor for native mobile features
- Ionic components provide responsive design
- Use Capacitor Preferences for local storage
- Consider offline functionality and data sync

## Location and Maps

- Google Maps integration for location selection
- PostGIS for efficient location queries
- Implement proper permission handling for device location
- Use appropriate zoom levels and markers for map displays

When generating code for this project, prioritize:
1. Type safety with TypeScript interfaces
2. Proper error handling and validation
3. Consistent code formatting and conventions
4. Mobile-first responsive design
5. Security best practices
6. Performance optimization for mobile devices