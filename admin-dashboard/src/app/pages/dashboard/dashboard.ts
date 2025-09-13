import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  currentUser: any;

  constructor(private router: Router) {
    const userStr = localStorage.getItem('adminUser');
    this.currentUser = userStr ? JSON.parse(userStr) : null;
  }

  logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    this.router.navigate(['/login']);
  }
}
