import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonRouterOutlet, IonIcon } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { Leads } from 'src/app/services/leads';
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
  private pollIntervalId: any;
  private autoCloseTimer: any;
  private previousCount = 0;

  constructor(
    private navCtrl: NavController,
    private leadsService: Leads
  ) {
    addIcons({ notificationsOutline, closeOutline, arrowForwardOutline, sparklesOutline, giftOutline });
  }

  ngOnInit() {
    this.checkForNewLeads();

    // Poll for new leads every 20 seconds
    this.pollIntervalId = setInterval(() => {
      this.checkForNewLeads();
    }, 20000);
  }

  ngOnDestroy() {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
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

  triggerNewLeadAlert() {
    this.fetchLatestLeadDetails();
    this.showNewLeadAlert = true;

    // Reset and start 20 seconds auto-dismiss timer
    this.clearAutoCloseTimer();
    this.autoCloseTimer = setTimeout(() => {
      this.showNewLeadAlert = false;
    }, 20000);
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

        // Trigger alert if new leads arrived
        if (currentCount > this.previousCount && currentCount > 0) {
          this.triggerNewLeadAlert();
        }

        this.previousCount = currentCount;
      },
      error: () => {}
    });
  }

  fetchLatestLeadDetails() {
    this.leadsService.getLeads().subscribe({
      next: (leads: any) => {
        if (Array.isArray(leads) && leads.length > 0) {
          const newLead = leads.find((l: any) => l.response === 'new') || leads[0];
          this.latestLead = newLead;
        }
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
