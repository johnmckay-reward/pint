import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Preferences } from '@capacitor/preferences';

export type ThemeMode = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';
  private currentTheme = new BehaviorSubject<ThemeMode>('auto');
  
  public theme$ = this.currentTheme.asObservable();

  constructor() {
    this.initializeTheme();
  }

  private async initializeTheme(): Promise<void> {
    try {
      const savedTheme = await Preferences.get({ key: this.THEME_KEY });
      const theme = (savedTheme.value as ThemeMode) || 'auto';
      this.setTheme(theme);
    } catch (error) {
      console.error('Error loading theme preference:', error);
      this.setTheme('auto');
    }
  }

  async setTheme(theme: ThemeMode): Promise<void> {
    this.currentTheme.next(theme);
    await this.saveThemePreference(theme);
    this.applyTheme(theme);
  }

  private async saveThemePreference(theme: ThemeMode): Promise<void> {
    try {
      await Preferences.set({
        key: this.THEME_KEY,
        value: theme
      });
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  }

  private applyTheme(theme: ThemeMode): void {
    const body = document.body;
    
    // Remove existing theme classes
    body.classList.remove('dark', 'light');
    
    if (theme === 'dark') {
      body.classList.add('dark');
    } else if (theme === 'light') {
      body.classList.add('light');
    } else {
      // Auto mode - use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        body.classList.add('dark');
      } else {
        body.classList.add('light');
      }
    }
  }

  getCurrentTheme(): ThemeMode {
    return this.currentTheme.value;
  }

  isDarkMode(): boolean {
    return document.body.classList.contains('dark');
  }

  toggleTheme(): void {
    const current = this.getCurrentTheme();
    let next: ThemeMode;
    
    switch (current) {
      case 'light':
        next = 'dark';
        break;
      case 'dark':
        next = 'auto';
        break;
      case 'auto':
      default:
        next = 'light';
        break;
    }
    
    this.setTheme(next);
  }
}