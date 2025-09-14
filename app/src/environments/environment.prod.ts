import { firebaseConfig } from './firebase.config';

export const environment = {
  production: true,
  firebase: firebaseConfig,
  sentry: {
    dsn: '', // Set this to your actual Sentry DSN in production
    enableInDev: false
  }
};
