# Pint 🍻

A social drinking application that connects people through pub meetups. Create and join location-based drinking sessions, find nearby pubs, and connect with fellow pub-goers.

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL with PostGIS extension
- Angular CLI

### Setup

1. **Install dependencies:**
   ```bash
   # Frontend
   cd app && npm install
   
   # Backend
   cd ../api && npm install
   
   # Partner Dashboard
   cd ../pint-dashboard && npm install
   
   # Admin Dashboard
   cd ../admin-dashboard && npm install
   ```

2. **Database setup:**
   - Create PostgreSQL database with PostGIS extension
   - Configure environment variables for database connection

3. **Run the application:**
   ```bash
   # Start backend (terminal 1)
   cd api && node index.js
   
   # Start frontend (terminal 2)
   cd app && npm start
   
   # Start partner dashboard (terminal 3)
   cd pint-dashboard && npm start
   
   # Start admin dashboard (terminal 4)
   cd admin-dashboard && npm start
   ```

## Project Structure

- `app/` - Angular/Ionic frontend application (main user app)
- `api/` - Node.js/Express backend API
- `pint-dashboard/` - Angular partner dashboard for pub owners
- `admin-dashboard/` - Angular admin dashboard for platform management
- `website/` - Marketing website and pub partner onboarding

## Tech Stack

- **Frontend**: Angular 20, Ionic 8, TypeScript
- **Backend**: Node.js, Express, JavaScript
- **Database**: PostgreSQL with Sequelize ORM
- **Mobile**: Capacitor for native app deployment
- **Testing**: Playwright (E2E), Karma/Jasmine (Unit)
- **Monitoring**: Sentry for error tracking

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
```

### Performance Monitoring

- Bundle analysis: `npm run build -- --stats-json` then analyze with webpack-bundle-analyzer
- Lighthouse audits for performance optimization
- Current bundle size: ~1MB (target: reduce to <800KB)

## Production Deployment

### Environment Configuration

1. **API Configuration** (copy `api/.env.example` to `api/.env`):
   - Database credentials
   - JWT secrets
   - Sentry DSN for error tracking
   - CORS settings
   - Admin user credentials for database seeding

2. **Frontend Configuration** (set build-time environment variables):
   - Sentry DSN
   - API base URL
   - Google Maps API key
   - Stripe publishable key

### Deployment Architecture

The Pint platform consists of 5 applications that should be deployed as follows:

#### Subdomain Strategy
```
https://app.pint.com          → Main User App (Angular/Ionic)
https://partners.pint.com     → Partner Dashboard (Angular)
https://admin.pint.com        → Admin Dashboard (Angular - Internal Access Only)
https://api.pint.com          → Backend API (Node.js/Express)
https://www.pint.com          → Marketing Website (Static HTML)
```

#### Database Initialization

Before first deployment, initialize the database with required data:

```bash
# Set environment variables for admin user
export ADMIN_EMAIL=admin@yourcompany.com
export ADMIN_PASSWORD=YourSecureAdminPassword123!
export ADMIN_DISPLAY_NAME="Platform Administrator"

# Run database seeding script
cd api && npm run seed:prod
```

This creates:
- Database schema (tables and relationships)
- Default admin user with provided credentials
- Achievement definitions for the platform
- Proper indexes for optimal performance

### Security Checklist

- [x] All environment variables configured (no hardcoded secrets)
- [x] CORS restricted to production domains
- [x] HTTPS enabled for all endpoints
- [x] Database connection secured
- [x] JWT secrets are cryptographically secure
- [x] Rate limiting enabled
- [x] Input validation on all endpoints
- [x] Role-based access control implemented
- [x] Admin credentials secured via environment variables

### Deployment Steps

1. **Build Production Assets:**
   ```bash
   # Main User App
   cd app && ng build --configuration=production
   
   # Partner Dashboard
   cd ../pint-dashboard && ng build --configuration=production
   
   # Admin Dashboard
   cd ../admin-dashboard && ng build --configuration=production
   ```

2. **Deploy Backend:**
   ```bash
   # Configure environment variables in production
   # Run database seeding (first time only)
   cd api && npm run seed:prod
   
   # Start Node.js server with PM2 or similar process manager
   pm2 start index.js --name "pint-api"
   ```

3. **Deploy Frontend Applications:**
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

4. **Configure CORS in API:**
   ```javascript
   // In api/index.js, update CORS configuration:
   const corsOptions = {
     origin: [
       'https://app.pint.com',
       'https://partners.pint.com', 
       'https://admin.pint.com',
       'https://www.pint.com'
     ],
     credentials: true
   };
   ```

### Post-Deployment Verification

1. **Health Checks:**
   ```bash
   # API Health Check
   curl https://api.pint.com/health
   
   # Database Connectivity
   curl https://api.pint.com/api/health/db
   ```

2. **Admin Access Verification:**
   - Navigate to `https://admin.pint.com`
   - Login with the admin credentials set during seeding
   - Verify admin dashboard functionality

3. **Cross-Application Integration Test:**
   - Test the master E2E flow across all applications
   - Verify CORS is working correctly
   - Check that all applications can communicate with the API

### Monitoring

- **Error Tracking**: Sentry integration for both frontend and backend
- **Performance**: Lighthouse scores, bundle size monitoring
- **Uptime**: Configure health check endpoints (`/health`, `/api/health/db`)
- **Database**: Monitor query performance and connection pool
- **Security**: Monitor failed authentication attempts

### Backup and Recovery

1. **Database Backups:**
   ```bash
   # Daily automated backups
   pg_dump -h $DB_HOST -U $DB_USER $DB_NAME > backup_$(date +%Y%m%d).sql
   ```

2. **Configuration Backup:**
   - Store environment variables in secure configuration management
   - Backup DNS and SSL certificate configurations
   - Document deployment procedures

### Scaling Considerations

- **API**: Use load balancers for multiple Node.js instances
- **Database**: Implement read replicas for heavy read workloads
- **CDN**: Use CDN for static assets and frontend bundles
- **Monitoring**: Set up alerts for high CPU, memory, or response times

### Emergency Procedures

- **Rollback**: Keep previous builds for quick rollback if needed
- **Database**: Have tested database rollback procedures
- **Monitoring**: Set up alerts for critical failures
- **Support**: Document escalation procedures for production issues

## Features

- User authentication and profiles
- Location-based pub session discovery
- Create and join drinking meetups
- Real-time session management
- Mobile-responsive design
- Partner dashboard for pub owners
- Admin dashboard for platform management
- Subscription management
- Achievement system
- Real-time chat functionality
- Pub partner onboarding and approval system

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