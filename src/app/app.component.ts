import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { PushNotifications, Token, PushNotification } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { FcmService } from './services/fcm';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(private fcmService: FcmService) {}
  

  ngOnInit(): void {
    this.initializeApp();
  }

  initializeApp() {
  this.fcmService.initPush();
}


  
}
