import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { PushNotifications, Token, PushNotification } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { FcmService } from './services/fcm';
import { AppUpdate, AppUpdateInfo } from '@capawesome/capacitor-app-update';
import { Platform } from '@ionic/angular';
import { OtaKit } from '@otakit/capacitor-updater';
import { Subscription } from 'rxjs';
import { SocketService } from './services/socket';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit, OnDestroy {
  showRelaunchPrompt = false;
  newVersion = '';
  isRelaunching = false;
  isSocketConnected = false;
  private socketSub?: Subscription;

  constructor(
    private fcmService: FcmService,
    private platform: Platform,
    private ngZone: NgZone,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.initializeApp();

    // Track Socket.IO connection state
    this.socketSub = this.socketService.onConnectionChange().subscribe((connected) => {
      this.ngZone.run(() => {
        this.isSocketConnected = connected;
      });
    });
    this.isSocketConnected = this.socketService.isConnected;

    this.platform.ready().then(async () => {
      // Notify OtaKit that the app started successfully (prevents automatic rollback)
      if (Capacitor.isNativePlatform()) {
        try {
          await OtaKit.notifyAppReady();
        } catch (e) {
          console.warn('[OtaKit] notifyAppReady error:', e);
        }

        // Setup silent background OTA update checks & staged listeners
        this.setupOtaUpdates();
      }

      // Only run this on Android devices
      if (this.platform.is('android')) {
        await this.checkForUpdate();
      }
    });
  }

  private async setupOtaUpdates() {
    try {
      // 1. Listen for background download completion (staged)
      await OtaKit.addListener('updateStaged', (event) => {
        this.ngZone.run(() => {
          this.newVersion = event.bundle?.version || '';
          this.showRelaunchPrompt = true;
        });
      });

      // 2. Check if an update was already staged previously
      const state = await OtaKit.getState();
      if (state.staged) {
        this.ngZone.run(() => {
          this.newVersion = state.staged?.version || '';
          this.showRelaunchPrompt = true;
        });
      }

      // 3. Perform silent background check & download
      const check = await OtaKit.check();
      if (check.kind === 'update_available') {
        this.newVersion = check.latest?.version || '';
        // Download silently in background (no UI progress shown)
        await OtaKit.download();
      } else if (check.kind === 'already_staged') {
        this.ngZone.run(() => {
          this.newVersion = check.latest?.version || '';
          this.showRelaunchPrompt = true;
        });
      }
    } catch (err) {
      console.warn('[OtaKit] Silent update setup error:', err);
    }
  }

  async relaunchApp() {
    this.isRelaunching = true;
    try {
      await OtaKit.apply();
    } catch (e) {
      console.error('[OtaKit] Failed to apply update:', e);
      this.isRelaunching = false;
    }
  }

  dismissPrompt() {
    this.showRelaunchPrompt = false;
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


  ngOnDestroy(): void {
    this.socketSub?.unsubscribe();
  }
}
