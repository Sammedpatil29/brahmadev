import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { PushNotifications, Token, PushNotification } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor() {}
  

  ngOnInit(): void {
    // this.initPush()
  }

  ionViewDidEnter() {
    // if (Capacitor.isNativePlatform()) {
    //   this.initPush();
    // }
  }


  
}
