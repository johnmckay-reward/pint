import { Component } from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-manage-account',
  templateUrl: './manage-account.page.html',
  styleUrls: ['./manage-account.page.scss'],
  standalone: false
})
export class ManageAccountPage {

  constructor(
    private navCtrl: NavController,
    private alertController: AlertController
  ) { }

  /**
   * @description
   * Presents a confirmation alert before proceeding with account deletion.
   * This is a critical safety feature to prevent accidental deletion.
   */
  async confirmDeleteAccount(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Are you absolutely sure?',
      message: 'This action cannot be undone. All your data will be lost forever.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Account deletion cancelled.');
          },
        },
        {
          text: 'Delete',
          cssClass: 'alert-button-danger', // Use a custom class for styling if needed
          handler: () => {
            this.deleteAccount();
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * @description
   * Contains the logic to permanently delete the user's account.
   * This function is only called after the user confirms via the alert.
   */
  private deleteAccount(): void {
    console.log('Deleting account now...');
    // TODO: Implement actual Firebase account deletion logic here.
    // This would involve deleting the user's auth record and their Firestore data.

    // After successful deletion, navigate the user back to the login screen.
    this.navCtrl.navigateRoot('/login');
  }
}
