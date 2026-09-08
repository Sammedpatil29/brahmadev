import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonButton, IonList, IonItem, IonLabel, IonInput, IonIcon, IonFooter, IonSelectOption, IonTextarea, IonModal, IonSpinner } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, call, callOutline, globeOutline, image, locationOutline, logoFacebook, logoInstagram, navigateCircle, navigateCircleOutline, timeOutline, send, journalOutline, sendSharp, chatboxEllipsesOutline, cloudOfflineOutline, checkmarkCircleOutline, checkmarkCircle, calendarOutline, documentTextOutline, trophyOutline, closeCircleOutline, personCircle, copyOutline, personAddOutline, personCircleOutline, searchOutline, closeOutline, chevronDownOutline } from 'ionicons/icons';
import { Leads } from 'src/app/services/leads';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-lead-details',
  templateUrl: './lead-details.page.html',
  styleUrls: ['./lead-details.page.scss'],
  standalone: true,
  imports: [IonSpinner, IonModal, IonTextarea, IonFooter, IonIcon, IonInput, IonLabel, IonItem, IonList, IonButton, IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonSelectOption]
})
export class LeadDetailsPage implements OnInit {

  newComment: any;
  isSending: boolean = false;
  id: any;
  scheduledDate = '';
  lead: any = {
    "comment": [],
    "userList": [],
    "access": []
  };

  statusList = [
    'Interested', 
    'Not Interested', 
    'Yet To Think', 
    'Call back Requested', 
    'Busy', 
    'Long Distance',
    'Visit Confirmed', 
    'Visiting Soon', 
    'Wrong Number',
    'Quotation Sent',
    'Closed',
    'new',
  ];
  editData: any;
  isUpdatingDate = false;
  isUpdatingResponse = false;
  isLoading: boolean = false;
  hideButton: boolean = false;
  currentUserId: any;

  // Access specific loader
  isUpdatingAccess = false;

  // Status search & filtering
  statusSearchQuery = '';

  get filteredStatusList(): string[] {
    if (!this.statusSearchQuery || !this.statusSearchQuery.trim()) {
      return this.statusList;
    }
    const q = this.statusSearchQuery.toLowerCase().trim();
    return this.statusList.filter(s => s.toLowerCase().includes(q));
  }

  getStatusColor(status: string): { bg: string, text: string, dot: string } {
    const s = (status || '').toLowerCase().trim();
    if (['interested', 'visit confirmed', 'visiting soon', 'quotation sent'].includes(s)) {
      return { bg: '#ecfdf5', text: '#065f46', dot: '#10b981' };
    }
    if (['yet to think', 'call back requested', 'busy'].includes(s)) {
      return { bg: '#fffbeb', text: '#92400e', dot: '#f59e0b' };
    }
    if (['not interested', 'wrong number', 'closed'].includes(s)) {
      return { bg: '#fef2f2', text: '#991b1b', dot: '#ef4444' };
    }
    if (['long distance'].includes(s)) {
      return { bg: '#f5f3ff', text: '#5b21b6', dot: '#8b5cf6' };
    }
    return { bg: '#eff6ff', text: '#1e40af', dot: '#3b82f6' };
  }

  constructor(
    private navCtrl: NavController, 
    private service: Leads, 
    private route: ActivatedRoute, 
    private toastController: ToastController, 
    private router: Router
  ) {
    addIcons({
      arrowBackOutline, callOutline, copyOutline, locationOutline, documentTextOutline, 
      chatboxEllipsesOutline, send, personCircle, checkmarkCircleOutline, checkmarkCircle, 
      calendarOutline, trophyOutline, closeCircleOutline, cloudOfflineOutline, journalOutline, 
      sendSharp, logoFacebook, logoInstagram, globeOutline, timeOutline, call, 
      navigateCircleOutline, image, navigateCircle, personAddOutline, personCircleOutline,
      searchOutline, closeOutline, chevronDownOutline
    });
  }

  ngOnInit() {
    let token: any = localStorage.getItem('userToken');
    if (token) {
      let decoded: any = jwtDecode(token);
      this.currentUserId = decoded.id;
    }
    this.route.queryParams.subscribe(params => {
      this.id = params['id'];
      if (this.id) {
        this.getLeadDetails();
      }
    });
  }

  back() {
    this.navCtrl.back();
  }

  callNow() {
    if (this.lead && this.lead.contact) {
      window.open(`tel:${this.lead.contact}`, '_system');
    } else {
      console.error("No contact number available");
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.saveChanges();
    }
  }

  saveChanges() {
    const text = this.newComment ? this.newComment.trim() : '';
    if (!text || this.isSending) return;

    const user = localStorage.getItem('userName') || 'User';
    
    // Instantly empty the input box for immediate feedback
    this.newComment = '';
    this.isSending = true;

    const isNew = this.lead?.response === 'new';
    const params = {
      "newComment": text,
      "response": isNew ? "Conversion Started" : "",
      "city": "",
      "user": user
    };

    this.service.updateLeads(params, this.lead.id).subscribe({
      next: (res: any) => {
        this.lead = res;
        this.isSending = false;
        this.scrollToBottom();
      },
      error: async (err: any) => {
        console.error('Error saving progress note:', err);
        // Restore comment text if the request fails so user does not lose it
        this.newComment = text;
        this.isSending = false;
        const toast = await this.toastController.create({
          message: 'Failed to save progress note. Please try again.',
          duration: 3000,
          color: 'danger',
          position: 'bottom'
        });
        await toast.present();
      }
    });
  }

  scrollToBottom() {
    setTimeout(() => {
      const container = document.querySelector('.chat-content');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 120);
  }

  updateStatus(arg0: string) {
    if (this.isUpdatingResponse) return;
    this.isUpdatingResponse = true;
    const prev = this.lead?.response;
    if (this.lead) {
      this.lead.response = arg0;
    }

    let params = {
      "response": arg0
    };
    this.service.updateLeads(params, this.lead.id).subscribe({
      next: (res: any) => {
        this.lead = res;
        this.isUpdatingResponse = false;
        this.statusSearchQuery = '';
      },
      error: async (err: any) => {
        console.error('Error updating status:', err);
        if (this.lead) {
          this.lead.response = prev;
        }
        this.isUpdatingResponse = false;
        const toast = await this.toastController.create({
          message: 'Failed to update status.',
          duration: 2500,
          color: 'danger',
          position: 'bottom'
        });
        await toast.present();
      }
    });
  }

  // --- ACCESS MANAGEMENT LOGIC ---

  // Check if a user ID is in the access array
  isUserHasAccess(userId: number): boolean {
    return this.lead.access && this.lead.access.includes(userId);
  }

  // Get Label for the UI button
  getAssignedUserLabel(): string {
    if (!this.lead.access || this.lead.access.length === 0 || !this.lead.userList) {
      return '';
    }
    
    // Get the first user ID from the access array
    const firstId = this.lead.access[0];
    
    // Find the user object in userList that matches this ID
    const user = this.lead.userList.find((u: any) => u.id === firstId);
    
    if (!user) return '';

    // If more than 1 person, show "Name +X"
    if (this.lead.access.length > 1) {
      return `${user.name} +${this.lead.access.length - 1}`;
    }
    
    return user.name;
  }

  // Toggle user access
  updateAccess(user: any) {
    this.isUpdatingAccess = true;
    
    let currentAccess = this.lead.access ? [...this.lead.access] : [];
    
    if (currentAccess.includes(user.id)) {
      // Remove
      currentAccess = currentAccess.filter(id => id !== user.id);
    } else {
      // Add
      currentAccess.push(user.id);
    }

    let params = {
      "access": currentAccess
    };

    this.service.updateLeads(params, this.lead.id).subscribe({
      next: (res: any) => {
        this.lead = res;
        this.isUpdatingAccess = false;
      },
      error: (err) => {
        console.error('Access update failed', err);
        this.isUpdatingAccess = false;
      }
    });
  }
  // -------------------------------

  getLeadDetails() {
    this.isLoading = true;
    this.service.getLeadDetails(this.id).subscribe((res: any) => {
      this.lead = res;
      this.statusList = res.status;
      if (this.lead.userList) {
        if (this.lead.userList.find((x: any) => x.id == this.currentUserId)) {
          this.hideButton = true;
        }
      }
      this.isLoading = false;
      this.scrollToBottom();
    }, error => {
      this.isLoading = false;
    });
  }

  async copyToClipboard(text: string, event: Event) {
    event.stopPropagation();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }

  sendQuote() {
    const navigationExtras: NavigationExtras = {
      state: {
        customerName: this.lead.name,
        contact: this.lead.contact,
        city: this.lead.city 
      }
    };
    this.router.navigate(['layout/quotation'], navigationExtras);
  }

  onDateTimeSelected(value: string) {
    if (!value) return;

    this.scheduledDate = value;
    const params = {
      "visit_schedule": value 
    };
    this.isUpdatingDate = true;
    
    this.service.updateLeads(params, this.lead.id).subscribe({
      next: (res: any) => {
        this.lead = res;
        this.isUpdatingDate = false;
      },
      error: (err) => {
        console.error('Update failed', err);
        this.isUpdatingDate = false;
      }
    });
  }
}