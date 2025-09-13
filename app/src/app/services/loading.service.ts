import { Injectable, inject } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';

export type LoadingType = 'spinner' | 'skeleton';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingCounter = new BehaviorSubject<number>(0);
  public isLoading$ = this.loadingCounter.asObservable();
  private currentLoader: HTMLIonLoadingElement | null = null;

  private loadingController = inject(LoadingController);

  async showLoading(
    message: string = 'Loading...', 
    spinner: 'bubbles' | 'circles' | 'crescent' = 'crescent',
    type: LoadingType = 'spinner'
  ) {
    this.incrementLoader();
    
    if (type === 'skeleton') {
      // For skeleton loading, we don't show the ionic loader
      // The UI should handle skeleton display based on isLoading$
      return null;
    }
    
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
  async withLoading<T>(promise: Promise<T>, message?: string, type: LoadingType = 'spinner'): Promise<T> {
    await this.showLoading(message, 'crescent', type);
    try {
      const result = await promise;
      return result;
    } finally {
      await this.hideLoading();
    }
  }

  // Skeleton loading helpers
  async showSkeletonLoading(): Promise<void> {
    await this.showLoading('', 'crescent', 'skeleton');
  }

  async withSkeletonLoading<T>(promise: Promise<T>): Promise<T> {
    return this.withLoading(promise, '', 'skeleton');
  }

  // Get current loading count for UI decisions
  getLoadingCount(): number {
    return this.loadingCounter.value;
  }

  // Check if currently loading
  isCurrentlyLoading(): boolean {
    return this.loadingCounter.value > 0;
  }
}