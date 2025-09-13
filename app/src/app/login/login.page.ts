// src/app/pages/login/login.page.ts
import { Component, OnInit } from '@angular/core';
import { NavController, AlertController, LoadingController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService, AuthResponse, LoginRequest } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { finalize } from 'rxjs/operators';

/*
* To use Reactive Forms, you need to import `ReactiveFormsModule` into the
* module that declares this component (e.g., `LoginPageModule`).
*/

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {

  loginForm: FormGroup;

  constructor(
    private navCtrl: NavController,
    private apiService: ApiService,
    private authService: AuthService,
    private formBuilder: FormBuilder,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    // Initialize the form group in the constructor
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit() {
    // Lifecycle hook for any additional initialization
  }

  /**
   * @description Handles the form submission for user login.
   * It validates the form, calls the API service, and handles success or error responses.
   */
  async login(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched(); // Mark all fields as touched to show errors
      return;
    }

    // Create and present a loading indicator
    const loading = await this.loadingController.create({
      message: 'Signing in...',
      spinner: 'crescent'
    });
    await loading.present();

    this.apiService.login(this.loginForm.value as LoginRequest)
      .pipe(
        // Ensure the loading indicator is dismissed on completion
        finalize(() => loading.dismiss())
      )
      .subscribe({
        next: (response: AuthResponse) => {
          console.log('Login successful', response);
          // Set authentication state
          this.authService.setAuthenticationState(response);
          // Navigate to the main part of the app
          this.navCtrl.navigateRoot('/dashboard');
        },
        error: (err) => {
          console.error('Login failed', err);
          this.presentErrorAlert('Login Failed', 'Invalid email or password. Please try again.');
        }
      });
  }

  /**
   * @description Navigates the user to the registration page.
   */
  navigateToRegister(): void {
    // Assuming you have a '/register' route defined in your routing module
    this.navCtrl.navigateForward('/register');
  }

  /**
   * @description Presents a generic error alert to the user.
   * @param header The title of the alert.
   * @param message The main message of the alert.
   */
  private async presentErrorAlert(header: string, message: string): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
