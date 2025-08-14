import { Component } from '@angular/core';

@Component({
  selector: 'app-support',
  templateUrl: './support.page.html',
  styleUrls: ['./support.page.scss'],
  standalone: false
})
export class SupportPage {

  constructor() { }

  /**
   * @description
   * Handles the tap on the 'Contact Support' button.
   * In a real app, this would open the device's default mail client.
   */
  contactSupport(): void {
    const email = 'support@pintapp.com';
    const subject = 'Pint? App Support Request';
    
    console.log(`Attempting to open mail client for: ${email}`);
    // In a real Capacitor app, you would use a plugin to open the mail composer.
    // For example: window.location.href = `mailto:${email}?subject=${subject}`;
  }
}
