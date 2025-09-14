# Firebase Project Setup Guide

This guide walks you through setting up a complete Firebase project for the Pint social drinking platform, from creating a new Firebase project to deploying all services.

## 🚀 Quick Start Checklist

- [ ] Create Firebase project
- [ ] Enable required Firebase services
- [ ] Configure authentication providers
- [ ] Set up Firestore database
- [ ] Install Firebase CLI
- [ ] Configure project settings
- [ ] Deploy security rules
- [ ] Deploy Cloud Functions
- [ ] Configure environment variables
- [ ] Test the setup

## Prerequisites

- **Node.js 18+**: Required for Firebase Functions
- **Google Account**: For Firebase Console access
- **Stripe Account**: For payment processing (optional for basic setup)

## Step 1: Create Firebase Project

1. **Go to Firebase Console**
   - Visit [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project" or "Add project"

2. **Project Configuration**
   - **Project name**: `pint-app` (or your preferred name)
   - **Project ID**: `pint-app-12345` (must be globally unique)
   - **Analytics**: Enable Google Analytics (recommended)
   - **Analytics account**: Select existing or create new

3. **Note your Project ID**
   - Save your project ID - you'll need it throughout this setup
   - Example: `pint-app-12345`

## Step 2: Enable Firebase Services

In your Firebase Console, enable the following services:

### Authentication
1. **Navigate**: Authentication → Sign-in method
2. **Enable Providers**:
   - **Google**: 
     - Click "Google" → Enable
     - Add your app's domain to authorized domains
   - **Apple** (for iOS):
     - Click "Apple" → Enable
     - Configure Apple Developer settings

### Firestore Database
1. **Navigate**: Firestore Database → Create database
2. **Security Rules**: Start in test mode (we'll deploy production rules later)
3. **Location**: Choose closest to your users (e.g., `us-central1`)

### Cloud Functions
1. **Navigate**: Functions (will be enabled when you deploy)
2. **Billing**: Upgrade to Blaze plan (pay-as-you-go) for Functions

### Hosting (Optional)
1. **Navigate**: Hosting → Get started
2. **Configure**: For marketing website deployment

## Step 3: Install Firebase CLI

```bash
# Install globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Verify installation
firebase --version
```

## Step 4: Configure Project Settings

1. **Clone this repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd pint
   ```

2. **Update `.firebaserc`**:
   ```json
   {
     "projects": {
       "default": "your-actual-project-id"
     }
   }
   ```

3. **Get Firebase Configuration**:
   - Go to Firebase Console → Project Settings → General
   - Scroll to "Your apps" section
   - Click "Add app" → Web (</>) 
   - Register app with nickname: "Pint Web App"
   - Copy the configuration object

4. **Update Firebase Config Files**:

   **`app/src/environments/firebase.config.ts`**:
   ```typescript
   export const firebaseConfig = {
     apiKey: "AIzaSyC...",
     authDomain: "your-project-id.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project-id.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123def456",
     measurementId: "G-XXXXXXXXXX"
   };
   ```

   **`pint-dashboard/src/environments/firebase.config.ts`**:
   ```typescript
   // Copy the same configuration as above
   export const firebaseConfig = {
     // ... same config
   };
   ```

   **`admin-dashboard/src/environments/firebase.config.ts`**:
   ```typescript
   // Copy the same configuration as above
   export const firebaseConfig = {
     // ... same config
   };
   ```

## Step 5: Deploy Firestore Security Rules

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

## Step 6: Set Up Cloud Functions

1. **Install Function Dependencies**:
   ```bash
   cd functions
   npm install
   ```

2. **Configure Environment Variables**:
   ```bash
   # For Stripe integration (if using payments)
   firebase functions:config:set stripe.secret_key="sk_live_..." # or sk_test_...
   firebase functions:config:set stripe.webhook_secret="whsec_..."
   
   # App configuration
   firebase functions:config:set app.frontend_url="https://your-domain.com"
   
   # Verify configuration
   firebase functions:config:get
   ```

3. **Build and Deploy Functions**:
   ```bash
   # Build functions
   npm run build
   
   # Deploy all functions
   firebase deploy --only functions
   
   # Or deploy specific functions
   firebase deploy --only functions:payments
   firebase deploy --only functions:adminApi
   ```

## Step 7: Configure Authentication Domains

1. **In Firebase Console**: Authentication → Settings → Authorized domains
2. **Add your domains**:
   - `localhost` (for development)
   - Your production domain (e.g., `pintapp.com`)
   - Firebase hosting domain (e.g., `your-project-id.web.app`)

## Step 8: Set Up Angular Applications

### Main User App
```bash
cd app
npm install

# Update environment with your Firebase config (already done in Step 4)
# Start development server
npm start
```

### Partner Dashboard
```bash
cd pint-dashboard
npm install

# Update environment with your Firebase config (already done in Step 4)
# Start development server
npm start
```

### Admin Dashboard
```bash
cd admin-dashboard
npm install

# Update environment with your Firebase config (already done in Step 4)
# Start development server
npm start
```

## Step 9: Test Your Setup

### Test Authentication
1. Start any of the Angular apps: `npm start`
2. Navigate to the login page
3. Try signing in with Google
4. Check Firebase Console → Authentication → Users to see the new user

### Test Firestore
1. Create a test session in the app
2. Check Firebase Console → Firestore Database to see the new document
3. Verify real-time updates work

### Test Cloud Functions
```bash
# Start emulators for local testing
firebase emulators:start

# Test function endpoints
curl http://localhost:5001/your-project-id/us-central1/payments/subscription/status
```

## Step 10: Production Deployment

### Deploy Static Website (Optional)
```bash
# Deploy marketing website to Firebase Hosting
firebase deploy --only hosting
```

### Deploy Angular Apps
```bash
# Build and deploy main app
cd app
npm run build
# Deploy to your hosting provider

# Build and deploy dashboards
cd ../pint-dashboard
npm run build
# Deploy to your hosting provider

cd ../admin-dashboard
npm run build
# Deploy to your hosting provider
```

## Environment Variables Summary

### Firebase Functions Config
```bash
# Required for payments
firebase functions:config:set stripe.secret_key="sk_live_..."
firebase functions:config:set stripe.webhook_secret="whsec_..."

# Required for app
firebase functions:config:set app.frontend_url="https://your-domain.com"

# Optional for enhanced features
firebase functions:config:set sentry.dsn="https://..."
firebase functions:config:set analytics.tracking_id="GA-..."
```

### Angular Environment Files
All Angular apps need the Firebase configuration in their respective `firebase.config.ts` files as shown in Step 4.

## Stripe Integration (Optional)

If you want to enable payment features:

1. **Create Stripe Account**: [stripe.com](https://stripe.com)
2. **Get API Keys**: Dashboard → Developers → API keys
3. **Set Webhook Endpoint**: 
   - URL: `https://us-central1-your-project-id.cloudfunctions.net/payments/stripe-webhook`
   - Events: Select relevant subscription events
4. **Configure Functions**: Use the webhook secret in Firebase Functions config

## Common Issues & Solutions

### "Project not found" Error
- Verify `.firebaserc` has correct project ID
- Ensure you have access to the Firebase project
- Run `firebase use your-project-id`

### Authentication Issues
- Check authorized domains in Firebase Console
- Verify Firebase config in Angular environment files
- Ensure OAuth providers are properly configured

### Function Deployment Failures
- Check Node.js version (requires 18+)
- Verify billing is enabled (Blaze plan required)
- Check function logs: `firebase functions:log`

### Firestore Permission Denied
- Verify security rules are deployed
- Check user authentication status
- Ensure user document exists in Firestore

## Security Checklist

- [ ] Firestore security rules deployed and tested
- [ ] Authentication domains restricted to your domains only
- [ ] API keys restricted to necessary services
- [ ] Stripe webhooks configured with proper secrets
- [ ] User roles and permissions implemented
- [ ] Admin access properly restricted

## Next Steps

1. **Customize the App**: Modify colors, branding, and features to match your needs
2. **Set Up Analytics**: Configure Google Analytics and Firebase Analytics
3. **Enable Monitoring**: Set up error tracking and performance monitoring
4. **Scale Configuration**: Configure auto-scaling and performance settings
5. **Backup Strategy**: Set up regular Firestore backups

## Support & Resources

- **Firebase Documentation**: [firebase.google.com/docs](https://firebase.google.com/docs)
- **Angular Documentation**: [angular.io](https://angular.io)
- **Ionic Documentation**: [ionicframework.com](https://ionicframework.com)
- **Stripe Documentation**: [stripe.com/docs](https://stripe.com/docs)

---

✅ **Your Firebase project is now ready!** All services are configured and the Pint platform should be fully functional.