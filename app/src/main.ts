import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import * as Sentry from '@sentry/angular';
import { browserTracingIntegration } from '@sentry/angular';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

// Initialize Sentry for error tracking
Sentry.init({
  dsn: environment.sentry.dsn,
  environment: environment.production ? 'production' : 'development',
  integrations: [
    browserTracingIntegration(),
  ],
  tracesSampleRate: 0.1, // Capture 10% of transactions for performance monitoring
  beforeSend(event, hint) {
    // Don't send events in development unless explicitly enabled
    if (!environment.production && !environment.sentry.enableInDev) {
      return null;
    }
    return event;
  }
});

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => {
    console.log(err);
    // Send bootstrap errors to Sentry in production
    if (environment.production) {
      Sentry.captureException(err);
    }
  });
