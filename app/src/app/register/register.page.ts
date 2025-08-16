import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, NavController } from '@ionic/angular';
import { ApiService, AuthResponse } from '../services/api.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage implements OnInit {
  registerForm: FormGroup;
  profileImagePreview: string | null = null;
  private selectedFile: File | null = null;

  constructor(
    private navCtrl: NavController,
    private apiService: ApiService,
    private formBuilder: FormBuilder,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    // Initialize the form group in the constructor
    this.registerForm = this.formBuilder.group({
      displayName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      favouriteTipple: [''], // Optional field
    });
  }

  ngOnInit() {
    // Lifecycle hook for any additional initialization
  }

  /**
   * @description Handles the selection of a profile picture file.
   * @param event The file input change event.
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];

      // Generate a preview
      const reader = new FileReader();
      reader.onload = () => {
        // Ensure the result is a string before assigning
        this.profileImagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  /**
   * @description Handles the form submission for user registration.
   * It validates the form, calls the API service, and handles success or error responses.
   */
  async register(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Creating account...',
      spinner: 'crescent'
    });
    await loading.present();

    // For the proof of concept, we send the base64 string directly.
    // The `profileImagePreview` property already holds the base64 data URL.
    const registrationData = {
      ...this.registerForm.value,
      profilePictureUrl: this.profileImagePreview || '' // Use the preview string or an empty string
    };

    this.apiService.register(registrationData)
      .pipe(
        finalize(() => loading.dismiss())
      )
      .subscribe({
        next: (response: AuthResponse) => {
          console.log('Registration successful', response);
          // TODO: Save the auth token securely
          this.navCtrl.navigateRoot('/dashboard');
        },
        error: (err) => {
          console.error('Registration failed', err);
          const message = err.error?.message || 'An unknown error occurred. Please try again.';
          this.presentErrorAlert('Registration Failed', message);
        }
      });
  }

  /**
   * @description Navigates the user back to the login page.
   */
  navigateToLogin(): void {
    this.navCtrl.navigateBack('/login');
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
