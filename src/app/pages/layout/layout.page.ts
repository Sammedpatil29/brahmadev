import { Component, OnInit, OnDestroy } from '@angular/core';
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

  constructor(
    private navCtrl: NavController,
    private leadsService: Leads,
    private socketService: SocketService
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

    // Fetch initial new leads count quietly for badge/display without showing alert toast
    this.checkForNewLeads();

    // Listen to real-time new lead alerts exclusively via Socket.IO
    this.socketSubscription = this.socketService.onNewLead().subscribe((leadData: any) => {
      if (leadData) {
        this.latestLead = leadData;
        this.newLeadsCount = (this.newLeadsCount || 0) + 1;
        this.showNewLeadAlert = true;

        // Clear previous auto-dismiss timer before starting new alert
        this.clearAutoCloseTimer();

        // Play looping alarm sound
        this.playAlarmSound();

        // Start 30 seconds auto-dismiss timer
        this.autoCloseTimer = setTimeout(() => {
          this.showNewLeadAlert = false;
          this.stopAlarmSound();
        }, 30000);
      }
    });
  }

  ngOnDestroy() {
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }
    this.removeAudioUnlocker();
    this.clearAutoCloseTimer();
    this.stopAlarmSound();
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
    this.showNewLeadAlert = false;
  }

  viewLeads() {
    this.clearAutoCloseTimer();
    this.stopAlarmSound();
    this.showNewLeadAlert = false;
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
