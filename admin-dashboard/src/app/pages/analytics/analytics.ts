import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, Analytics as AnalyticsData } from '../../services/admin.service';

@Component({
  selector: 'app-analytics',
  imports: [CommonModule],
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss'
})
export class Analytics implements OnInit {
  analytics: AnalyticsData | null = null;
  loading = true;
  error = '';

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadAnalytics();
  }

  loadAnalytics() {
    this.loading = true;
    this.adminService.getAnalytics().subscribe({
      next: (data) => {
        this.analytics = data;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load analytics data';
        this.loading = false;
        console.error('Analytics error:', error);
      }
    });
  }
}
