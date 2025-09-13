import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService, LoginRequest } from '../../services/admin.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  credentials: LoginRequest = { email: '', password: '' };
  loading = false;
  error = '';

  constructor(
    private adminService: AdminService,
    private router: Router
  ) {}

  async onSubmit() {
    if (!this.credentials.email || !this.credentials.password) {
      this.error = 'Please fill in all fields';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const response = await this.adminService.login(this.credentials).toPromise();
      
      if (response && response.user.role === 'admin') {
        localStorage.setItem('adminToken', response.token);
        localStorage.setItem('adminUser', JSON.stringify(response.user));
        this.router.navigate(['/dashboard']);
      } else {
        this.error = 'Access denied. Admin privileges required.';
      }
    } catch (error: any) {
      this.error = error.error?.error || 'Login failed. Please try again.';
    } finally {
      this.loading = false;
    }
  }
}
