import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(private toastController: ToastController) { }

  async presentSuccessToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'success',
      icon: 'checkmark-circle-outline'
    });
    toast.present();
  }

  async presentErrorToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 4000,
      position: 'top',
      color: 'danger',
      icon: 'alert-circle-outline',
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel'
        }
      ]
    });
    toast.present();
  }

  async presentInfoToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'primary',
      icon: 'information-circle-outline'
    });
    toast.present();
  }

  async presentLoadingToast(message: string = 'Loading...') {
    const toast = await this.toastController.create({
      message,
      duration: 10000, // Longer duration for loading states
      position: 'top',
      color: 'medium',
      icon: 'hourglass-outline'
    });
    toast.present();
    return toast; // Return toast so it can be dismissed manually
  }
}