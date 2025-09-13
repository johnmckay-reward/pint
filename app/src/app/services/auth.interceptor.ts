import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Preferences } from '@capacitor/preferences';
import { AuthResponse } from './api.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Get the auth token from storage
    return from(this.getAuthToken()).pipe(
      switchMap((token: string | null) => {
        if (token) {
          // Clone the request and add the authorization header
          const authReq = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${token}`)
          });
          return next.handle(authReq);
        } else {
          // If no token, proceed with the original request
          return next.handle(req);
        }
      })
    );
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key: 'authResponse' });
      if (value) {
        const authResponse: AuthResponse = JSON.parse(value);
        return authResponse.token;
      }
      return null;
    } catch {
      return null;
    }
  }
}