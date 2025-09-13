import { Component, OnInit, Input, inject } from '@angular/core';
import { ApiService } from '../../services/api.service';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  key: string;
  dateEarned: string;
}

@Component({
  selector: 'app-achievements',
  templateUrl: './achievements.component.html',
  styleUrls: ['./achievements.component.scss'],
  standalone: false
})
export class AchievementsComponent implements OnInit {
  private apiService = inject(ApiService);

  @Input() userId: string = '';
  
  achievements: Achievement[] = [];
  isLoading = false;

  ngOnInit() {
    if (this.userId) {
      this.loadAchievements();
    }
  }

  async loadAchievements() {
    this.isLoading = true;
    try {
      this.apiService.getUserAchievements(this.userId).subscribe({
        next: (response) => {
          this.achievements = response.achievements;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load achievements:', error);
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Failed to load achievements:', error);
      this.isLoading = false;
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
}