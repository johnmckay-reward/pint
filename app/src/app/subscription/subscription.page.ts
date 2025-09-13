import { Component, OnInit } from '@angular/core';
import { NavController, LoadingController, AlertController, ToastController } from '@ionic/angular';
import { ApiService, SubscriptionStatus } from '../services/api.service';
import { loadStripe, Stripe } from '@stripe/stripe-js';

@Component({
  selector: 'app-subscription',
  templateUrl: './subscription.page.html',
  styleUrls: ['./subscription.page.scss'],
  standalone: false
})
export class SubscriptionPage implements OnInit {
  subscriptionStatus: SubscriptionStatus | null = null;
  isLoading = false;
  stripe: Stripe | null = null;

  constructor(
    private navCtrl: NavController,
    private apiService: ApiService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  async ngOnInit() {
    // Initialize Stripe (in production, use your publishable key)
    this.stripe = await loadStripe('pk_test_placeholder');
    
    await this.loadSubscriptionStatus();
  }

  async loadSubscriptionStatus() {
    this.isLoading = true;
    try {
      this.apiService.getSubscriptionStatus().subscribe({
        next: (status) => {
          this.subscriptionStatus = status;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load subscription status:', error);
          this.isLoading = false;
          this.presentErrorAlert('Error', 'Failed to load subscription status');
        }
      });
    } catch (error) {
      console.error('Failed to load subscription status:', error);
      this.isLoading = false;
    }
  }

  async subscribeToPintPlus() {
    if (!this.stripe) {
      this.presentErrorAlert('Error', 'Stripe not initialized');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Redirecting to checkout...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      this.apiService.createCheckoutSession().subscribe({
        next: async (response) => {
          await loading.dismiss();
          
          // Redirect to Stripe Checkout
          const { error } = await this.stripe!.redirectToCheckout({
            sessionId: response.sessionId
          });

          if (error) {
            console.error('Stripe checkout error:', error);
            this.presentErrorAlert('Payment Error', error.message || 'Failed to redirect to checkout');
          }
        },
        error: async (error) => {
          await loading.dismiss();
          console.error('Failed to create checkout session:', error);
          this.presentErrorAlert('Error', 'Failed to create checkout session');
        }
      });
    } catch (error) {
      await loading.dismiss();
      console.error('Subscription error:', error);
      this.presentErrorAlert('Error', 'Failed to start subscription process');
    }
  }

  goBack() {
    this.navCtrl.back();
  }

  private async presentErrorAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  private async presentToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
