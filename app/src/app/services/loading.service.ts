import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingCounter = new BehaviorSubject<number>(0);
  public isLoading$ = this.loadingCounter.asObservable();
  private currentLoader: HTMLIonLoadingElement | null = null;

  constructor(private loadingController: LoadingController) { }

  async showLoading(message: string = 'Loading...', spinner: 'bubbles' | 'circles' | 'crescent' = 'crescent') {
    this.incrementLoader();
    
    if (this.currentLoader) {
      // Update existing loader
      this.currentLoader.message = message;
      return this.currentLoader;
    }

    this.currentLoader = await this.loadingController.create({
      message,
      spinner,
      cssClass: 'custom-loading',
      backdropDismiss: false
    });

    await this.currentLoader.present();
    return this.currentLoader;
  }

  async hideLoading() {
    this.decrementLoader();
    
    if (this.loadingCounter.value <= 0 && this.currentLoader) {
      await this.currentLoader.dismiss();
      this.currentLoader = null;
    }
  }

  private incrementLoader() {
    this.loadingCounter.next(this.loadingCounter.value + 1);
  }

  private decrementLoader() {
    const currentValue = this.loadingCounter.value;
    if (currentValue > 0) {
      this.loadingCounter.next(currentValue - 1);
    }
  }

  // Quick helper for wrapping async operations with loading
  async withLoading<T>(promise: Promise<T>, message?: string): Promise<T> {
    await this.showLoading(message);
    try {
      const result = await promise;
      return result;
    } finally {
      await this.hideLoading();
    }
  }
}