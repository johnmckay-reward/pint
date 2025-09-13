import { Injectable } from '@angular/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Platform } from '@ionic/angular';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

@Injectable({
  providedIn: 'root'
})
export class HapticService {
  private isSupported = false;

  constructor(private platform: Platform) {
    this.checkSupport();
  }

  private async checkSupport(): Promise<void> {
    this.isSupported = this.platform.is('ios') || this.platform.is('android');
  }

  async impact(style: HapticType = 'medium'): Promise<void> {
    if (!this.isSupported) return;

    try {
      let impactStyle: ImpactStyle;
      
      switch (style) {
        case 'light':
          impactStyle = ImpactStyle.Light;
          break;
        case 'heavy':
        case 'error':
          impactStyle = ImpactStyle.Heavy;
          break;
        case 'medium':
        case 'success':
        case 'warning':
        default:
          impactStyle = ImpactStyle.Medium;
          break;
      }

      await Haptics.impact({ style: impactStyle });
    } catch (error) {
      console.debug('Haptic feedback not available:', error);
    }
  }

  async selection(): Promise<void> {
    if (!this.isSupported) return;

    try {
      await Haptics.selectionStart();
      setTimeout(() => Haptics.selectionEnd(), 50);
    } catch (error) {
      console.debug('Haptic selection feedback not available:', error);
    }
  }

  async notification(type: 'success' | 'warning' | 'error' = 'success'): Promise<void> {
    if (!this.isSupported) return;

    try {
      // Use different impact styles for different notification types
      switch (type) {
        case 'success':
          await this.impact('light');
          setTimeout(() => this.impact('light'), 100);
          break;
        case 'warning':
          await this.impact('medium');
          break;
        case 'error':
          await this.impact('heavy');
          break;
      }
    } catch (error) {
      console.debug('Haptic notification feedback not available:', error);
    }
  }

  // Convenience methods for common UI interactions
  async buttonPress(): Promise<void> {
    await this.impact('light');
  }

  async joinSession(): Promise<void> {
    await this.impact('medium');
  }

  async sendMessage(): Promise<void> {
    await this.impact('light');
  }

  async achievementUnlocked(): Promise<void> {
    await this.notification('success');
  }

  async errorOccurred(): Promise<void> {
    await this.notification('error');
  }
}