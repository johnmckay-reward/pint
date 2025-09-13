import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastService } from './toast.service';
import * as Sentry from '@sentry/angular';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private toastService = inject(ToastService);


  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An unexpected error occurred';

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // Server-side error
          switch (error.status) {
            case 400:
              errorMessage = error.error?.message || 'Invalid request';
              break;
            case 401:
              errorMessage = 'Please log in to continue';
              break;
            case 403:
              errorMessage = 'You don\'t have permission to perform this action';
              break;
            case 404:
              errorMessage = 'The requested resource was not found';
              break;
            case 500:
              errorMessage = 'Server error. Please try again later';
              break;
            case 0:
              errorMessage = 'Unable to connect to the server. Please check your internet connection';
              break;
            default:
              errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
          }
        }

        // Show user-friendly error message
        this.toastService.presentErrorToast(errorMessage);

        // Log error to Sentry in production
        Sentry.captureException(error);

        // Re-throw the error so components can handle it if needed
        return throwError(() => error);
      })
    );
  }
}