import { Injectable } from '@angular/core';

export interface AccessibilityAnnouncement {
  message: string;
  priority?: 'polite' | 'assertive';
  delay?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  private announcer: HTMLElement | null = null;

  constructor() {
    this.initializeAnnouncer();
  }

  private initializeAnnouncer(): void {
    if (typeof document !== 'undefined') {
      this.announcer = document.createElement('div');
      this.announcer.setAttribute('aria-live', 'polite');
      this.announcer.setAttribute('aria-atomic', 'true');
      this.announcer.style.position = 'absolute';
      this.announcer.style.left = '-10000px';
      this.announcer.style.width = '1px';
      this.announcer.style.height = '1px';
      this.announcer.style.overflow = 'hidden';
      document.body.appendChild(this.announcer);
    }
  }

  /**
   * Announce a message to screen readers
   */
  announce(announcement: AccessibilityAnnouncement | string): void {
    if (!this.announcer) return;

    const config = typeof announcement === 'string' 
      ? { message: announcement, priority: 'polite' as const, delay: 100 }
      : { priority: 'polite', delay: 100, ...announcement };

    // Update aria-live attribute based on priority
    this.announcer.setAttribute('aria-live', config.priority);

    // Clear previous content and add new message after a small delay
    setTimeout(() => {
      if (this.announcer) {
        this.announcer.textContent = config.message;
      }
    }, config.delay);

    // Clear the message after it's been announced
    setTimeout(() => {
      if (this.announcer) {
        this.announcer.textContent = '';
      }
    }, config.delay + 1000);
  }

  /**
   * Announce loading states
   */
  announceLoading(message: string = 'Loading'): void {
    this.announce({
      message,
      priority: 'polite',
      delay: 200
    });
  }

  /**
   * Announce completion of actions
   */
  announceSuccess(message: string): void {
    this.announce({
      message,
      priority: 'assertive',
      delay: 100
    });
  }

  /**
   * Announce errors
   */
  announceError(message: string): void {
    this.announce({
      message: `Error: ${message}`,
      priority: 'assertive',
      delay: 50
    });
  }

  /**
   * Set focus to an element with proper timing
   */
  setFocus(element: HTMLElement | null, delay: number = 100): void {
    if (!element) return;

    setTimeout(() => {
      element.focus();
    }, delay);
  }

  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Get appropriate animation duration based on user preferences
   */
  getAnimationDuration(normalDuration: number = 300): number {
    return this.prefersReducedMotion() ? 50 : normalDuration;
  }

  /**
   * Add skip link functionality
   */
  addSkipLink(targetId: string, linkText: string = 'Skip to main content'): void {
    if (typeof document === 'undefined') return;

    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.textContent = linkText;
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: var(--ion-color-primary);
      color: var(--ion-color-primary-contrast);
      padding: 8px 16px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 10000;
      font-weight: 600;
      transition: top 0.2s ease;
    `;

    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });

    document.body.prepend(skipLink);
  }

  /**
   * Validate color contrast (basic implementation)
   */
  hasGoodContrast(foreground: string, background: string): boolean {
    // This is a simplified check - in a real app, you'd use a proper contrast calculation
    // For now, we'll just check if the colors are different enough
    const fgLuminance = this.getLuminance(foreground);
    const bgLuminance = this.getLuminance(background);
    const contrast = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                    (Math.min(fgLuminance, bgLuminance) + 0.05);
    
    return contrast >= 4.5; // WCAG AA standard
  }

  private getLuminance(color: string): number {
    // Very basic luminance calculation - would need a proper color parsing library in production
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
}