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
   ```

## Project Structure

- `app/` - Angular/Ionic frontend application (main user app)
- `api/` - Node.js/Express backend API
- `pint-dashboard/` - Angular partner dashboard

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

2. **Frontend Configuration** (set build-time environment variables):
   - Sentry DSN
   - API base URL
   - Google Maps API key
   - Stripe publishable key

### Security Checklist

- [ ] All environment variables configured (no hardcoded secrets)
- [ ] CORS restricted to production domains
- [ ] HTTPS enabled for all endpoints
- [ ] Database connection secured
- [ ] JWT secrets are cryptographically secure
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints

### Deployment Steps

1. **Build Production Assets:**
   ```bash
   cd app && ng build --configuration=production
   cd ../pint-dashboard && ng build --configuration=production
   ```

2. **Deploy Backend:**
   - Configure environment variables
   - Run database migrations
   - Start Node.js server with PM2 or similar

3. **Deploy Frontend:**
   - Serve built files via CDN or web server
   - Configure proper routing for SPA

### Monitoring

- **Error Tracking**: Sentry integration for both frontend and backend
- **Performance**: Lighthouse scores, bundle size monitoring
- **Uptime**: Configure health check endpoints

## Features

- User authentication and profiles
- Location-based pub session discovery
- Create and join drinking meetups
- Real-time session management
- Mobile-responsive design
- Partner dashboard for pub owners
- Subscription management
- Achievement system
- Real-time chat functionality

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