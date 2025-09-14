# Firebase Functions for Pint App

This directory contains Firebase Cloud Functions that handle server-side operations for the Pint social drinking platform.

## Functions Overview

### Payment Functions (`/payments`)
- **`createCheckoutSession`** - Creates Stripe checkout sessions for Pint Plus subscriptions
- **`payments/stripe-webhook`** - Handles Stripe webhook events for subscription management
- **`payments/subscription/status`** - Returns user's current subscription status

### Admin Functions (`/admin`)
- **`getAnalytics`** - Returns platform analytics and statistics
- **`admin/users`** - User management endpoints
- **`admin/pub-claims`** - Pub ownership claim approval system
- **`admin/messages/:sessionId/:messageId`** - Content moderation (message deletion)

## Setup

1. Install dependencies:
   ```bash
   cd functions
   npm install
   ```

2. Configure environment variables:
   ```bash
   firebase functions:config:set stripe.secret_key="sk_..."
   firebase functions:config:set stripe.webhook_secret="whsec_..."
   firebase functions:config:set app.frontend_url="https://your-app.com"
   ```

3. Build the functions:
   ```bash
   npm run build
   ```

## Development

### Local Development
```bash
# Start Firebase emulators
npm run serve

# Watch for changes
npm run build:watch
```

### Testing
```bash
# Run ESLint
npm run lint

# Test functions locally
npm run shell
```

### Deployment
```bash
# Deploy all functions
npm run deploy

# Deploy specific function
firebase deploy --only functions:payments
```

## Environment Configuration

Set the following configuration variables:

```bash
# Stripe configuration
firebase functions:config:set stripe.secret_key="sk_live_..." # or sk_test_...
firebase functions:config:set stripe.webhook_secret="whsec_..."

# App configuration
firebase functions:config:set app.frontend_url="https://your-app.com"
```

## Security

- All functions require Firebase Authentication
- Admin functions require `role: 'admin'` in user document
- Payment functions validate user subscriptions
- CORS is configured for allowed origins only

## API Usage

### Callable Functions (Recommended)
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const createCheckout = httpsCallable(functions, 'createCheckoutSession');

// Create subscription checkout
const result = await createCheckout();
```

### HTTP Functions (Alternative)
```typescript
// Using HTTP endpoints with Authorization header
const response = await fetch('https://us-central1-your-project.cloudfunctions.net/payments/create-checkout-session', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  }
});
```

## Migration from Express API

These functions replace the previous Express.js API endpoints:

- `POST /api/subscriptions/create-checkout-session` → `payments/create-checkout-session`
- `POST /api/subscriptions/stripe-webhooks` → `payments/stripe-webhook`
- `GET /api/subscriptions/status` → `payments/subscription/status`
- `GET /api/admin/analytics` → `admin/analytics`
- `GET /api/admin/users` → `admin/users`
- `GET /api/admin/pub-claims` → `admin/pub-claims`

## Error Handling

Functions return standard HTTP status codes and error messages:

```json
{
  "error": "Error message",
  "code": "error-code"
}
```

Common error codes:
- `unauthenticated` - Missing or invalid authentication
- `permission-denied` - Insufficient permissions
- `not-found` - Resource not found
- `already-exists` - Resource already exists
- `internal` - Server error