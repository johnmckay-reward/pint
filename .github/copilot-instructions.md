# Copilot Instructions for Pint App

## Project Overview

Pint is a comprehensive social drinking platform that connects people through pub meetups. The platform consists of five integrated applications serving different user types: pub-goers, pub owners, and platform administrators.

## Architecture

### Tech Stack
- **Frontend**: Angular 20 + Ionic 8 (TypeScript)
- **Backend**: Node.js + Express (JavaScript)
- **Database**: PostgreSQL with Sequelize ORM
- **Mobile**: Capacitor for iOS/Android deployment
- **Admin**: Angular 20 (TypeScript)
- **Website**: Static HTML/CSS/JavaScript

### Project Structure
```
/
├── app/                # Angular/Ionic user-facing application
│   ├── src/
│   │   ├── app/
│   │   │   ├── services/    # API services and business logic
│   │   │   └── [pages]/     # Ionic page components
│   │   └── theme/           # Global styles and theming
├── api/                # Node.js/Express backend
│   ├── models/         # Sequelize database models
│   ├── routes/         # Express route handlers
│   │   ├── auth.js     # User authentication
│   │   ├── users.js    # User management
│   │   ├── partner.js  # Partner-specific routes
│   │   └── admin.js    # Admin-only routes
│   ├── middleware/     # Authentication and authorization
│   └── services/       # Business logic services
├── pint-dashboard/     # Angular partner dashboard for pub owners
│   ├── src/
│   │   ├── app/
│   │   │   ├── services/    # Partner API services
│   │   │   └── [pages]/     # Dashboard pages
│   │   └── assets/          # Partner-specific assets
├── admin-dashboard/    # Angular admin dashboard for platform management
│   ├── src/
│   │   ├── app/
│   │   │   ├── services/    # Admin API services
│   │   │   └── pages/       # Admin dashboard pages
│   │   └── assets/          # Admin-specific assets
└── website/            # Marketing website and pub onboarding
    ├── index.html      # Main landing page
    └── pubs.html       # Pub partner onboarding page
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
- Centralized backend serving all applications
- Features: Authentication, data management, business logic
- Serves: All frontend applications with role-based endpoints
- Technology: Node.js + Express + PostgreSQL

## Core Domain Models

### User Model
- UUID primary key
- Email (unique, validated)
- Hashed password (bcrypt)
- Display name
- Favorite tipple (drink preference)
- Profile picture URL
- Role (user, pub_owner, admin)
- Subscription tier (free, plus)

### PintSession Model
- UUID primary key
- Pub name
- ETA (estimated time of arrival)
- Location (PostGIS GEOMETRY point)
- Relationships: User (initiator), Users (attendees)

### Friendship Model
- UUID primary key
- Requester and requested user IDs
- Status (pending, accepted, declined)
- Created and updated timestamps

### Achievement Model
- UUID primary key
- Name, description, icon
- Point value
- Achievement criteria

### UserAchievement Model
- Junction table for users and achievements
- Earned timestamp

### ChatMessage Model
- UUID primary key
- Content, sender ID, session ID
- Created timestamp
- Relationships: User (sender), PintSession

### PubOwner Model
- UUID primary key
- User ID (who owns/manages the pub)
- Pub name and address
- Status (pending, approved, rejected)
- Business verification details
- Approval/rejection metadata

### Pub Model
- UUID primary key
- Name, address, location coordinates
- Operating hours, contact details
- Associated PubOwner

## Development Conventions

### Frontend (Angular/Ionic)

**Component Structure:**
- Use Ionic page components (`@Component` with `selector: 'app-[name]'`)
- Follow suffix conventions: `Page` for pages, `Component` for reusable components
- Use kebab-case for selectors, camelCase for properties

**Services:**
- Place all API calls in `ApiService`
- Use RxJS Observables for async operations
- Store authentication tokens using Capacitor Preferences
- Define TypeScript interfaces for API responses

**Styling:**
- Use SCSS for component styles
- Keep component styles under 2KB budget
- Follow Ionic theming conventions
- Use CSS custom properties for theming

**Routing:**
- Use Angular Router with lazy-loaded modules
- Each page should have its own module for code splitting

### Backend (Node.js/Express)

**API Structure:**
- RESTful endpoints under `/api` prefix
- Group routes by domain and user type:
  - `/api/auth` - Authentication endpoints
  - `/api/users` - User management
  - `/api/sessions` - Pint session management
  - `/api/friends` - Friend system
  - `/api/subscriptions` - Subscription management
  - `/api/partner/*` - Partner-specific endpoints (pub owners)
  - `/api/admin/*` - Admin-only endpoints (platform management)
- Use Express Router for modular route organization

**Database:**
- Use Sequelize ORM for all database operations
- Define models in separate files under `/models`
- Use UUID v4 for all primary keys
- Implement proper associations between models
- Use hooks for password hashing and data validation

**Authentication:**
- JWT-based authentication
- Role-based authorization with three user types:
  - `user` - Regular app users
  - `pub_owner` - Pub owners with partner dashboard access
  - `admin` - Platform administrators with full access
- Middleware for protected routes:
  - `authenticateToken` - Validates JWT for any authenticated user
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