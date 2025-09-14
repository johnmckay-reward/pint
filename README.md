# Pint 🍻

A social drinking application that connects people through pub meetups. Create and join location-based drinking sessions, find nearby pubs, and connect with fellow pub-goers.

## Quick Start

### Prerequisites
- Node.js 18+
- Firebase project with Authentication and Firestore enabled
- Angular CLI

### Setup

1. **Install dependencies:**
   ```bash
   # Frontend
   cd app && npm install
   
   # Partner Dashboard
   cd ../pint-dashboard && npm install
   
   # Admin Dashboard
   cd ../admin-dashboard && npm install
   
   # API (minimal - mainly for payments/admin functions)
   cd ../api && npm install
   ```

2. **Firebase Configuration:**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication with Google and Apple providers
   - Enable Cloud Firestore
   - Copy your Firebase config and update:
     - `app/src/environments/firebase.config.ts`
     - `pint-dashboard/src/environments/firebase.config.ts`
     - `admin-dashboard/src/environments/firebase.config.ts`

3. **Deploy Firestore Security Rules:**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login and deploy rules
   firebase login
   firebase deploy --only firestore:rules
   ```

4. **Run the application:**
   ```bash
   # Start frontend (terminal 1)
   cd app && npm start
   
   # Start partner dashboard (terminal 2)
   cd pint-dashboard && npm start
   
   # Start admin dashboard (terminal 3)
   cd admin-dashboard && npm start
   
   # Start API (optional - for payments/admin) (terminal 4)
   cd api && node index.js
   ```

## Project Structure

- `app/` - Angular/Ionic frontend application (main user app)
- `api/` - Node.js/Express API (minimal - payments/admin functions only)
- `pint-dashboard/` - Angular partner dashboard for pub owners
- `admin-dashboard/` - Angular admin dashboard for platform management
- `website/` - Marketing website and pub partner onboarding
- `firestore.rules` - Firestore security rules

## Tech Stack

- **Frontend**: Angular 20, Ionic 8, TypeScript
- **Authentication**: Firebase Authentication (Google & Apple sign-in)
- **Database**: Cloud Firestore with real-time capabilities
- **Geospatial**: Geohashing with geofire-common for location queries
- **Mobile**: Capacitor for native app deployment
- **Testing**: Playwright (E2E), Karma/Jasmine (Unit)
- **Monitoring**: Sentry for error tracking
- **Payments**: Stripe integration via minimal Express API

## Development

### Building and Testing

```bash
# Build applications
cd app && npm run build
cd ../pint-dashboard && npm run build
cd ../admin-dashboard && npm run build

# Run tests
cd app && npm test
cd ../app && npm run e2e  # E2E tests with Playwright

# Linting
cd app && npm run lint

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

### Performance Monitoring

- Bundle analysis: `npm run build -- --stats-json` then analyze with webpack-bundle-analyzer
- Lighthouse audits for performance optimization
- Current bundle size: ~1MB (target: reduce to <800KB)

## Production Deployment

### Environment Configuration

1. **Firebase Configuration**:
   - Firebase project ID and API keys
   - Authentication providers (Google, Apple)
   - Firestore database region
   - Security rules deployment

2. **API Configuration** (optional - for payments/admin functions):
   - Stripe API keys
   - Admin authentication secrets
   - Sentry DSN for error tracking

3. **Frontend Configuration**:
   - Firebase configuration objects
   - Sentry DSN
   - Google Maps API key (for location features)
   - Stripe publishable key

### Deployment Architecture

The Pint platform consists of 5 applications that should be deployed as follows:

#### Subdomain Strategy
```
https://app.pint.com          → Main User App (Angular/Ionic)
https://partners.pint.com     → Partner Dashboard (Angular)
https://admin.pint.com        → Admin Dashboard (Angular - Internal Access Only)
https://api.pint.com          → Minimal API (Payments/Admin Functions)
https://www.pint.com          → Marketing Website (Static HTML)
```

#### Firebase Setup

Before deployment, configure your Firebase project:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize Firebase project
firebase login
firebase init firestore

# Deploy security rules
firebase deploy --only firestore:rules

# Set up Authentication providers
# - Enable Google sign-in in Firebase Console
# - Enable Apple sign-in in Firebase Console
# - Configure OAuth redirect URIs for production domains
```

### Security Checklist

- [x] Firebase project configured with proper security rules
- [x] Authentication restricted to approved providers (Google, Apple)
- [x] Firestore security rules implement role-based access control
- [x] HTTPS enabled for all endpoints
- [x] API endpoints secured for payments and admin functions
- [x] Environment variables configured (no hardcoded secrets)
- [x] Input validation via Firestore security rules
- [x] Real-time data access properly secured

### Deployment Steps

1. **Configure Firebase Project:**
   ```bash
   # Deploy Firestore security rules
   firebase deploy --only firestore:rules
   
   # Configure Authentication providers in Firebase Console
   # - Add production domains to authorized domains
   # - Set up OAuth redirect URIs
   ```

2. **Build Production Assets:**
   ```bash
   # Main User App
   cd app && ng build --configuration=production
   
   # Partner Dashboard
   cd ../pint-dashboard && ng build --configuration=production
   
   # Admin Dashboard
   cd ../admin-dashboard && ng build --configuration=production
   ```

3. **Deploy API (Optional - for payments/admin):**
   ```bash
   # Configure environment variables in production
   # Start Node.js server with PM2 or similar process manager
   pm2 start index.js --name "pint-api"
   ```

4. **Deploy Frontend Applications:**
   ```bash
   # Upload built files to CDN or web servers
   # Configure proper routing for SPAs:
   
   # app.pint.com (Main User App)
   # - Serve from app/dist/
   # - Configure fallback to index.html for client-side routing
   
   # partners.pint.com (Partner Dashboard)
   # - Serve from pint-dashboard/dist/
   # - Configure fallback to index.html for client-side routing
   
   # admin.pint.com (Admin Dashboard - INTERNAL ACCESS ONLY)
   # - Serve from admin-dashboard/dist/
   # - Restrict access via IP whitelist or VPN
   # - Configure fallback to index.html for client-side routing
   
   # www.pint.com (Marketing Website)
   # - Serve from website/ directory
   # - Static files only, no special routing needed
   ```

5. **Firebase Production Configuration:**
   ```bash
   # Update Firebase configuration for production
   # - Add production domains to authorized domains
   # - Configure Firestore indexes for production queries
   # - Set up Firebase hosting rules if using Firebase Hosting
   ```

### Post-Deployment Verification

1. **Firebase Health Checks:**
   ```bash
   # Test Firebase Authentication
   # - Try Google sign-in on app.pint.com
   # - Try Apple sign-in on app.pint.com
   
   # Test Firestore connectivity
   # - Create a test pint session
   # - Verify real-time updates work
   
   # API Health Check (if using minimal API)
   curl https://api.pint.com/health
   ```

2. **Admin Access Verification:**
   - Navigate to `https://admin.pint.com`
   - Sign in with Google/Apple (ensure admin role in Firestore)
   - Verify admin dashboard functionality

3. **Cross-Application Integration Test:**
   - Test real-time data sync between applications
   - Verify Firestore security rules are working
   - Check geospatial session discovery

### Monitoring

- **Error Tracking**: Sentry integration for frontend applications
- **Performance**: Lighthouse scores, bundle size monitoring
- **Firebase Monitoring**: Built-in Firebase console monitoring
- **Real-time Data**: Monitor Firestore read/write operations
- **Authentication**: Track sign-in success rates and provider usage
- **Security**: Monitor failed authentication attempts via Firebase Auth

### Backup and Recovery

1. **Firestore Backups:**
   ```bash
   # Enable automatic daily backups in Firebase Console
   # Export specific collections for additional backup
   gcloud firestore export gs://your-backup-bucket
   ```

2. **Configuration Backup:**
   - Store Firebase configuration in secure configuration management
   - Backup Firestore security rules
   - Document Firebase project settings
   - Backup DNS and SSL certificate configurations

### Scaling Considerations

- **Firestore**: Automatic scaling handled by Firebase
- **Authentication**: Firebase Auth scales automatically
- **Frontend**: Use CDN for static assets and frontend bundles
- **Real-time Data**: Monitor Firestore concurrent connections
- **Geospatial Queries**: Optimize geohash precision for performance
- **API**: Scale minimal API endpoints for payments/admin functions

### Emergency Procedures

- **Rollback**: Keep previous builds for quick rollback if needed
- **Firebase**: Use Firebase Console for emergency configuration changes
- **Security Rules**: Have tested security rule rollback procedures
- **Monitoring**: Set up alerts for critical failures via Firebase Monitoring
- **Support**: Document escalation procedures for production issues

## Features

- Firebase Authentication with Google & Apple sign-in
- Real-time session discovery and updates via Firestore
- Location-based pub session discovery with geohashing
- Create and join drinking meetups
- Mobile-responsive design with Ionic
- Partner dashboard for pub owners
- Admin dashboard for platform management
- Subscription management (via Stripe integration)
- Achievement system
- Real-time chat functionality
- Pub partner onboarding and approval system
- Serverless architecture with Firebase

## Development Guidelines

See [Copilot Instructions](./.github/copilot-instructions.md) for detailed development guidelines and project conventions.

## Performance Optimization

### Bundle Size
- Main bundle: 1.01 MB (target: <800KB)
- Lazy loading implemented for routes
- Tree shaking enabled

### CSS Optimization
- 4 component styles exceed 2KB budget
- Shared styles extracted to reduce duplication

### Recommended Optimizations
1. Lazy load feature modules
2. Implement image compression and WebP format
3. Add service worker for caching
4. Optimize third-party dependencies

## Testing Strategy

### Unit Tests
- Angular components and services
- API route handlers and business logic
- Target: >80% code coverage

### E2E Tests
- Critical user flows (registration, session creation, joining)
- Cross-browser compatibility
- Mobile responsiveness

### Performance Tests
- Lighthouse audits
- Bundle size monitoring
- API response time benchmarks

## License

Private project - All rights reserved.