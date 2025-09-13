import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  registerForm: FormGroup;
  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      businessName: ['', [Validators.required, Validators.minLength(2)]],
      contactName: ['', [Validators.required, Validators.minLength(2)]],
      phoneNumber: ['']
    });

    // Redirect if already logged in
    if (this.apiService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;
      this.error = '';
      
      this.apiService.register(this.registerForm.value).subscribe({
        next: (response) => {
          this.loading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.loading = false;
          this.error = error.error?.error || 'Registration failed. Please try again.';
        }
      });
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
