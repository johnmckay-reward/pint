# Firebase Functions Deployment Guide

## Prerequisites

1. **Firebase CLI**: Install and authenticate
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Project Setup**: Initialize Firebase project
   ```bash
   firebase init
   # Select Functions, Firestore, and Hosting
   # Choose your Firebase project ID
   ```

## Environment Configuration

Set the required environment variables for your Firebase Functions:

```bash
# Stripe Configuration
firebase functions:config:set stripe.secret_key="sk_live_..." # or sk_test_...
firebase functions:config:set stripe.webhook_secret="whsec_..."

# App Configuration  
firebase functions:config:set app.frontend_url="https://your-app.com"

# View current config
firebase functions:config:get
```

## Local Development

1. **Install Dependencies**:
   ```bash
   cd functions
   npm install
   ```

2. **Start Emulators**:
   ```bash
   firebase emulators:start
   ```
   This starts:
   - Functions Emulator: http://localhost:5001
   - Firestore Emulator: http://localhost:8080
   - Auth Emulator: http://localhost:9099
   - Emulator UI: http://localhost:4000

3. **Test Functions Locally**:
   ```bash
   # HTTP Functions
   curl http://localhost:5001/your-project/us-central1/payments/subscription/status

   # Callable Functions (use Firebase SDK)
   const functions = getFunctions();
   connectFunctionsEmulator(functions, "localhost", 5001);
   ```

## Building and Deployment

1. **Build Functions**:
   ```bash
   cd functions
   npm run build
   ```

2. **Deploy All Functions**:
   ```bash
   firebase deploy --only functions
   ```

3. **Deploy Specific Functions**:
   ```bash
   firebase deploy --only functions:payments
   firebase deploy --only functions:adminApi
   firebase deploy --only functions:createCheckoutSession
   ```

## Function Endpoints

After deployment, your functions will be available at:

### HTTP Functions
- **Payments API**: `https://us-central1-{project-id}.cloudfunctions.net/payments`
  - `POST /create-checkout-session`
  - `POST /stripe-webhook`
  - `GET /subscription/status`

- **Admin API**: `https://us-central1-{project-id}.cloudfunctions.net/adminApi`
  - `GET /analytics`
  - `GET /users`
  - `PATCH /users/:userId/suspend`
  - `GET /pub-claims`
  - `PATCH /pub-claims/:claimId/approve`

### Callable Functions
- `createCheckoutSession()`
- `getAnalytics()`

## Client Integration

### Using Callable Functions (Recommended)
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const createCheckout = httpsCallable(functions, 'createCheckoutSession');

try {
  const result = await createCheckout();
  window.location.href = result.data.url;
} catch (error) {
  console.error('Error:', error);
}
```

### Using HTTP Functions
```typescript
const idToken = await user.getIdToken();

const response = await fetch(`https://us-central1-{project-id}.cloudfunctions.net/payments/create-checkout-session`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  }
});

const result = await response.json();
```

## Security Rules

Ensure your Firestore security rules allow the functions to access data:

```javascript
// Allow functions to read/write user data
match /users/{userId} {
  allow read, write: if request.auth != null && 
    (request.auth.uid == userId || 
     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
}
```

## Monitoring and Logs

1. **View Logs**:
   ```bash
   firebase functions:log
   firebase functions:log --only createCheckoutSession
   ```

2. **Firebase Console**: 
   - Go to Firebase Console → Functions
   - View metrics, logs, and performance

3. **Error Monitoring**:
   Functions automatically report errors to Firebase Console

## Troubleshooting

### Common Issues

1. **Permission Denied**:
   - Check Firestore security rules
   - Verify user authentication and admin role

2. **Stripe Webhook Failures**:
   - Verify webhook endpoint URL in Stripe Dashboard
   - Check webhook secret configuration
   - Review function logs for errors

3. **CORS Errors**:
   - Functions include CORS middleware
   - Verify allowed origins in production

4. **Cold Start Performance**:
   - Consider using Firebase Functions 2nd gen for better performance
   - Implement connection pooling for external services

### Development Tips

1. **Local Testing**:
   ```bash
   # Use emulator suite for full local development
   firebase emulators:start --import=./emulator-data --export-on-exit

   # Test with real Stripe in development
   firebase functions:config:set stripe.secret_key="sk_test_..."
   ```

2. **Environment Variables**:
   ```bash
   # For local development, create .env file in functions directory
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## Migration from Express API

The Firebase Functions replace these Express.js endpoints:

| Express Endpoint | Firebase Function |
|------------------|-------------------|
| `POST /api/subscriptions/create-checkout-session` | `payments/create-checkout-session` |
| `POST /api/subscriptions/stripe-webhooks` | `payments/stripe-webhook` |
| `GET /api/subscriptions/status` | `payments/subscription/status` |
| `GET /api/admin/analytics` | `adminApi/analytics` |
| `GET /api/admin/users` | `adminApi/users` |
| `GET /api/admin/pub-claims` | `adminApi/pub-claims` |

Update your client-side code to use the new function URLs or switch to callable functions for better type safety and error handling.