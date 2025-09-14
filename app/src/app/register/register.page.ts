import { Component, OnInit, inject } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage implements OnInit {
  private navCtrl = inject(NavController);

  constructor() {}

  ngOnInit() {
    console.log('RegisterPage initialized - redirecting to social sign-in');
  }

  /**
   * @description Navigate to the login page for social sign-in
   */
  goToLogin(): void {
    this.navCtrl.navigateRoot('/login');
  }

  /**
   * @description Go back to the previous page
   */
  goBack(): void {
    this.navCtrl.back();
  }
}