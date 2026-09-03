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

  constructor(
    private navCtrl: NavController,
    private leadsService: Leads,
    private socketService: SocketService
  ) {
    addIcons({ notificationsOutline, closeOutline, arrowForwardOutline, sparklesOutline, giftOutline });
  }

  ngOnInit() {
    // Fetch initial new leads count quietly for badge/display without showing alert toast
    this.checkForNewLeads();

    // Listen to real-time new lead alerts exclusively via Socket.IO
    this.socketSubscription = this.socketService.onNewLead().subscribe((leadData: any) => {
      if (leadData) {
        this.latestLead = leadData;
        this.newLeadsCount = (this.newLeadsCount || 0) + 1;
        this.showNewLeadAlert = true;

        // Reset and start 20 seconds auto-dismiss timer
        this.clearAutoCloseTimer();
        this.autoCloseTimer = setTimeout(() => {
          this.showNewLeadAlert = false;
        }, 20000);
      }
    });
  }

  ngOnDestroy() {
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }
    this.clearAutoCloseTimer();
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
    this.showNewLeadAlert = false;
  }

  viewLeads() {
    this.clearAutoCloseTimer();
    this.showNewLeadAlert = false;
    this.navCtrl.navigateForward('/layout/leads');
  }

}
