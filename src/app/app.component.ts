import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { PushNotifications, Token, PushNotification } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { FcmService } from './services/fcm';
import { AppUpdate, AppUpdateInfo } from '@capawesome/capacitor-app-update';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(private fcmService: FcmService, private platform: Platform) {}
  

  ngOnInit(): void {
    this.initializeApp();
    this.platform.ready().then(async () => {
      // Only run this on Android devices
      if (this.platform.is('android')) {
        await this.checkForUpdate();
      }
    });
  }

  initializeApp() {
  this.fcmService.initPush();
}

async checkForUpdate() {
    try {
      // 1. Get the current update info from Play Store
      const result: AppUpdateInfo = await AppUpdate.getAppUpdateInfo();

      // 2. Check if an update is actually available
      if (result.updateAvailability === 2) { // 2 means UPDATE_AVAILABLE
        
        // 3. Trigger the 'Immediate' update flow
        // This shows the full-screen Google prompt
        await AppUpdate.performImmediateUpdate();
      }
    } catch (e) {
      console.error('Update check failed:', e);
    }
  }


  
}
