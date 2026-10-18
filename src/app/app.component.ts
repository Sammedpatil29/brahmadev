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
  showUpdatedAlert = false;
  newVersion = '';
  updatedVersion = '';
  isRelaunching = false;
  isSocketConnected = false;
  private isApplyingUpdate = false;
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

        // Check if the app just restarted following an OTA update
        const justUpdated = localStorage.getItem('ota_app_just_updated');
        if (justUpdated) {
          localStorage.removeItem('ota_app_just_updated');
          this.ngZone.run(async () => {
            let ver = justUpdated !== 'true' ? justUpdated : '';
            try {
              const state = await OtaKit.getState();
              if (state?.current?.version && state.current.version !== '0.0.0') {
                ver = state.current.version;
              }
            } catch (err) {
              console.warn('[OtaKit] Error getting current version:', err);
            }
            this.updatedVersion = ver;
            this.showUpdatedAlert = true;

            // Auto-dismiss alert after 6 seconds
            setTimeout(() => {
              this.ngZone.run(() => {
                this.showUpdatedAlert = false;
              });
            }, 6000);
          });
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
      // 1. Listen for background download completion (staged) -> directly apply and restart
      await OtaKit.addListener('updateStaged', (event) => {
        const ver = event.bundle?.version || '';
        this.applyOtaUpdateDirectly(ver);
      });

      // 2. Check if an update was already staged previously -> directly apply and restart
      const state = await OtaKit.getState();
      if (state.staged && state.staged.id !== state.current?.id) {
        const ver = state.staged?.version || '';
        this.applyOtaUpdateDirectly(ver);
        return;
      }

      // 3. Perform silent background check & download
      const check = await OtaKit.check();
      if (check.kind === 'update_available') {
        const ver = check.latest?.version || '';
        // Download silently in background (no UI progress shown)
        const downloadRes = await OtaKit.download();
        if (downloadRes.kind === 'staged') {
          this.applyOtaUpdateDirectly(downloadRes.bundle?.version || ver);
        }
      } else if (check.kind === 'already_staged') {
        const ver = check.latest?.version || '';
        this.applyOtaUpdateDirectly(ver);
      }
    } catch (err) {
      console.warn('[OtaKit] Silent update setup error:', err);
    }
  }

  private async applyOtaUpdateDirectly(version?: string) {
    if (this.isApplyingUpdate) return;
    this.isApplyingUpdate = true;

    try {
      if (version) {
        localStorage.setItem('ota_app_just_updated', version);
      } else {
        localStorage.setItem('ota_app_just_updated', 'true');
      }
      console.log('[OtaKit] Applying update directly and restarting app...');
      await OtaKit.apply();
    } catch (e) {
      console.error('[OtaKit] Failed to apply update directly:', e);
      this.isApplyingUpdate = false;
      localStorage.removeItem('ota_app_just_updated');
    }
  }

  dismissUpdatedAlert() {
    this.showUpdatedAlert = false;
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
