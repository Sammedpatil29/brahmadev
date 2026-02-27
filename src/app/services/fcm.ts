import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Route, Router } from '@angular/router';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { Platform } from '@ionic/angular';
import { jwtDecode } from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class FcmService {
  constructor(private platform: Platform, private http: HttpClient, private route: Router) {}

  async initPush() {
    if (this.platform.is('capacitor')) {
      this.registerPush();
    }
  }

  private async registerPush() {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      throw new Error('User denied permissions!');
    }

    await PushNotifications.register();

    // On success, we get a token to identify this device
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('My FCM Token: ', token.value);
      // SEND THIS TOKEN TO YOUR BACKEND SERVER VIA API
      let userToken: any = localStorage.getItem('userToken')
      console.log('user token:', userToken)
      let decoded:any = jwtDecode(userToken)
      console.log('user id:', decoded)
      this.http.patch('https://brahmadev-backend-228218838131.asia-south1.run.app/users/fcm-token', {
    id: decoded.id, // Get this from your Auth state
    fcm_token: token.value
  }).subscribe({
    next: () => console.log('Token saved to server'),
    error: (err) => console.error('Failed to save token', err)
  });
    });

    // Handle what happens when a notification arrives
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Notification received: ', notification);
    });

    // Handle what happens when the user taps the notification
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Action performed: ', notification.notification);
      this.route.navigate(['/layout/leads'])
    });
  }
}