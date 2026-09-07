import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonRouterOutlet, IonIcon } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { Leads } from 'src/app/services/leads';
import { SocketService } from 'src/app/services/socket';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import { notificationsOutline, closeOutline, arrowForwardOutline, sparklesOutline, giftOutline } from 'ionicons/icons';

export interface AnnouncementItem {
  badge: string;
  text: string;
  actionText?: string;
  actionRoute?: string;
}

@Component({
  selector: 'app-layout',
  templateUrl: './layout.page.html',
  styleUrls: ['./layout.page.scss'],
  standalone: true,
  imports: [IonIcon, IonRouterOutlet, CommonModule, FormsModule]
})
export class LayoutPage implements OnInit, OnDestroy {

  // Festive & Special Event Announcement
  showAnnouncement: boolean = true;
  announcement: AnnouncementItem = {
    badge: 'Festival Offer',
    text: '🎉 Special Festive Offers on Turnkey Construction, Gypsum Plastering & Modular Interiors!',
    actionText: 'Estimate Cost',
    actionRoute: '/layout/fixed-cost'
  };

  showNewLeadAlert = false;
  latestLead: any = null;
  newLeadsCount = 0;
  private autoCloseTimer: any;
  private socketSubscription?: Subscription;
  private audioCtx: AudioContext | null = null;
  private alarmIntervalId: any = null;
  private audioElement: HTMLAudioElement | null = null;
  private userInteractionListener: any = null;
  private visibilityListener: any = null;
  private originalTitle: string = '';
  private titleFlashIntervalId: any = null;

  constructor(
    private navCtrl: NavController,
    private leadsService: Leads,
    private socketService: SocketService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ notificationsOutline, closeOutline, arrowForwardOutline, sparklesOutline, giftOutline });
  }

  ngOnInit() {
    // Setup HTML5 audio element
    try {
      this.audioElement = new Audio('assets/lead-alert.wav');
      this.audioElement.loop = true;
    } catch (e) {
      console.warn('HTMLAudioElement init error:', e);
    }

    // Pre-unlock audio on first user touch/click to comply with browser autoplay policies
    this.setupAudioUnlocker();

    // Setup tab visibility listener (detects when user switches away/to tab)
    this.setupVisibilityListener();

    // Request browser system notification permission (for desktop alerts when in other tabs)
    this.requestNotificationPermission();

    // Fetch initial new leads count quietly for badge/display without showing alert toast
    this.checkForNewLeads();

    // Listen to real-time new lead alerts exclusively via Socket.IO
    this.socketSubscription = this.socketService.onNewLead().subscribe((leadData: any) => {
      if (leadData) {
        this.ngZone.run(() => {
          this.latestLead = leadData;
          this.newLeadsCount = (this.newLeadsCount || 0) + 1;
          this.showNewLeadAlert = true;
          this.cdr.detectChanges();

          // Clear previous auto-dismiss timer before starting new alert
          this.clearAutoCloseTimer();

          // Play looping alarm sound
          this.playAlarmSound();

          // Check if tab is in background / user is on another tab
          const isTabHidden = typeof document !== 'undefined' && document.hidden;
          if (isTabHidden) {
            // 1. Show native OS / browser desktop notification (bypasses browser tab invisibility)
            this.showDesktopNotification(leadData);

            // 2. Flash browser tab title so user notices in the browser tab bar
            this.startTitleFlashing(leadData?.name || 'Customer');

            // NOTE: Do NOT auto-dismiss while hidden! Keep alert ready until user switches to tab.
          } else {
            // Tab is currently in foreground, auto-dismiss after 30 seconds
            this.startAutoCloseTimer(30000);
          }
        });
      }
    });
  }

  ngOnDestroy() {
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }
    this.removeAudioUnlocker();
    this.removeVisibilityListener();
    this.clearAutoCloseTimer();
    this.stopAlarmSound();
    this.stopTitleFlashing();
  }

  private setupAudioUnlocker() {
    this.userInteractionListener = () => {
      // Warm up HTMLAudioElement
      if (this.audioElement) {
        this.audioElement.load();
      }
      // Warm up AudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass && !this.audioCtx) {
        try {
          this.audioCtx = new AudioContextClass();
          if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
          }
        } catch (_) {}
      }
      // Request browser notification permission on first interaction
      this.requestNotificationPermission();

      this.removeAudioUnlocker();
    };

    window.addEventListener('click', this.userInteractionListener, { once: true, passive: true });
    window.addEventListener('touchstart', this.userInteractionListener, { once: true, passive: true });
    window.addEventListener('pointerdown', this.userInteractionListener, { once: true, passive: true });
  }

  private removeAudioUnlocker() {
    if (this.userInteractionListener) {
      window.removeEventListener('click', this.userInteractionListener);
      window.removeEventListener('touchstart', this.userInteractionListener);
      window.removeEventListener('pointerdown', this.userInteractionListener);
      this.userInteractionListener = null;
    }
  }

  private setupVisibilityListener() {
    this.visibilityListener = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        // User switched back to this tab
        this.stopTitleFlashing();

        // Ensure socket is actively connected and refresh lead count
        if (!this.socketService.isConnected) {
          this.socketService.connect();
        }
        this.checkForNewLeads();

        // If an alert is showing and no auto-dismiss timer is running, start 25s timer now
        if (this.showNewLeadAlert && !this.autoCloseTimer) {
          this.startAutoCloseTimer(25000);
        }
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.visibilityListener);
    }
  }

  private removeVisibilityListener() {
    if (this.visibilityListener && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityListener);
      this.visibilityListener = null;
    }
  }

  private requestNotificationPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(perm => {
          console.log('🔔 Desktop notification permission:', perm);
        }).catch(err => {
          console.warn('Could not request notification permission:', err);
        });
      }
    }
  }

  private showDesktopNotification(leadData: any) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        const leadName = leadData?.name || 'New Customer';
        const leadPlatform = leadData?.platform ? `[${leadData.platform}] ` : '';
        const leadContact = leadData?.contact ? ` • 📞 ${leadData.contact}` : '';
        const leadCity = leadData?.city ? ` • 📍 ${leadData.city}` : '';

        const notification = new Notification('🚨 New Lead Received!', {
          body: `${leadPlatform}${leadName}${leadContact}${leadCity}`,
          icon: 'assets/icon/favicon.png',
          badge: 'assets/icon/favicon.png',
          tag: 'brahmadev-new-lead',
          requireInteraction: true // Keeps notification visible until user interacts
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
          this.ngZone.run(() => {
            this.viewLeads();
          });
        };
      } catch (err) {
        console.warn('Error displaying desktop notification:', err);
      }
    } else if (Notification.permission === 'default') {
      this.requestNotificationPermission();
    }
  }

  private startTitleFlashing(leadName?: string) {
    this.stopTitleFlashing();
    if (typeof document === 'undefined') return;

    this.originalTitle = document.title || 'Brahmadev Constructions';
    let isAlert = true;

    this.titleFlashIntervalId = setInterval(() => {
      document.title = isAlert ? `🚨 (1) NEW LEAD: ${leadName || 'Customer'}!` : `⭐ ${this.originalTitle}`;
      isAlert = !isAlert;
    }, 1200);
  }

  private stopTitleFlashing() {
    if (this.titleFlashIntervalId) {
      clearInterval(this.titleFlashIntervalId);
      this.titleFlashIntervalId = null;
    }
    if (this.originalTitle && typeof document !== 'undefined') {
      document.title = this.originalTitle;
    }
  }

  private startAutoCloseTimer(durationMs: number = 30000) {
    this.clearAutoCloseTimer();
    this.autoCloseTimer = setTimeout(() => {
      this.ngZone.run(() => {
        this.showNewLeadAlert = false;
        this.stopAlarmSound();
        this.stopTitleFlashing();
        this.cdr.detectChanges();
      });
    }, durationMs);
  }

  dismissAnnouncement() {
    this.showAnnouncement = false;
  }

  onAnnouncementClick() {
    if (this.announcement.actionRoute) {
      this.navCtrl.navigateForward(this.announcement.actionRoute);
    }
  }

  clearAutoCloseTimer() {
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = null;
    }
  }

  checkForNewLeads() {
    const token = localStorage.getItem('userToken');
    if (!token) return;

    this.leadsService.getLeadCountNew().subscribe({
      next: (res: any) => {
        const currentCount = typeof res === 'number' ? res : (res?.count ?? res?.length ?? 0);
        this.newLeadsCount = currentCount;
      },
      error: () => {}
    });
  }

  closeAlert(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.clearAutoCloseTimer();
    this.stopAlarmSound();
    this.stopTitleFlashing();
    this.showNewLeadAlert = false;
    this.cdr.detectChanges();
  }

  viewLeads() {
    this.clearAutoCloseTimer();
    this.stopAlarmSound();
    this.stopTitleFlashing();
    this.showNewLeadAlert = false;
    this.cdr.detectChanges();
    this.navCtrl.navigateForward('/layout/leads');
  }

  private playAlarmSound() {
    this.stopAlarmSound();

    let htmlAudioPlayed = false;

    // 1. Try playing via HTMLAudioElement (looping asset)
    if (this.audioElement) {
      this.audioElement.currentTime = 0;
      const playPromise = this.audioElement.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          htmlAudioPlayed = true;
        }).catch(err => {
          if (err.name !== 'AbortError') {
            console.warn('HTMLAudio play failed, falling back to Web Audio synth:', err);
          }
        });
      }
    }

    // 2. Fallback / supplementary synthesized chime using Web Audio API
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioContextClass();
      }

      const playTone = () => {
        if (!this.audioCtx || this.audioCtx.state === 'closed') return;
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;

        // Tone 1: 880 Hz (A5)
        const osc1 = this.audioCtx.createOscillator();
        const gain1 = this.audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now);
        gain1.gain.setValueAtTime(0.35, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc1.connect(gain1);
        gain1.connect(this.audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.2);

        // Tone 2: 1175 Hz (D6)
        const osc2 = this.audioCtx.createOscillator();
        const gain2 = this.audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1175, now + 0.15);
        gain2.gain.setValueAtTime(0.35, now + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc2.connect(gain2);
        gain2.connect(this.audioCtx.destination);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.4);
      };

      // Play immediately
      playTone();

      // Loop every 1.2 seconds
      this.alarmIntervalId = setInterval(() => {
        playTone();
      }, 1200);
    } catch (err) {
      console.warn('Could not play alert alarm sound:', err);
    }
  }

  private stopAlarmSound() {
    // Stop HTML Audio
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch (_) {}
    }

    // Stop Web Audio intervals and synth
    if (this.alarmIntervalId) {
      clearInterval(this.alarmIntervalId);
      this.alarmIntervalId = null;
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (_) {}
      this.audioCtx = null;
    }
  }

}
