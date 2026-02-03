import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonButton, IonList, IonItem, IonLabel, IonInput, IonIcon, IonFooter, IonSelectOption, IonTextarea, IonModal, IonSpinner } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, call, callOutline, globeOutline, image, locationOutline, logoFacebook, logoInstagram, navigateCircle, navigateCircleOutline, timeOutline, send, journalOutline, sendSharp, chatboxEllipsesOutline, cloudOfflineOutline, checkmarkCircleOutline, calendarOutline, documentTextOutline, trophyOutline, closeCircleOutline, personCircle, copyOutline, personAddOutline, personCircleOutline } from 'ionicons/icons';
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

  constructor(
    private navCtrl: NavController, 
    private service: Leads, 
    private route: ActivatedRoute, 
    private toastController: ToastController, 
    private router: Router
  ) {
    addIcons({
      arrowBackOutline, callOutline, copyOutline, locationOutline, documentTextOutline, 
      chatboxEllipsesOutline, send, personCircle, checkmarkCircleOutline, calendarOutline, 
      trophyOutline, closeCircleOutline, cloudOfflineOutline, journalOutline, sendSharp, 
      logoFacebook, logoInstagram, globeOutline, timeOutline, call, navigateCircleOutline, 
      image, navigateCircle, personAddOutline, personCircleOutline
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

  saveChanges() {
    const user = localStorage.getItem('userName');
    
    if(this.lead.response == 'new'){
      let params = {
        "newComment": this.newComment,
        "response": "Conversion Started",
        "city": "",
        "user": user
      }
      this.service.updateLeads(params, this.lead.id).subscribe((res: any) => {
        this.lead = res;
      });
    } else {
      let params = {
        "newComment": this.newComment,
        "response": "",
        "city": "",
        "user": user
      }
      this.isSending = true;
      this.service.updateLeads(params, this.lead.id).subscribe((res: any) => {
        this.lead = res;
        this.newComment = '';
        this.isSending = false;
      }, error => {
        this.isSending = false;
      });
    }
  }

  updateStatus(arg0: string) {
    this.isUpdatingResponse = true;
    let params = {
      "response": arg0
    };
    this.service.updateLeads(params, this.lead.id).subscribe((res: any) => {
      this.lead = res;
      this.isUpdatingResponse = false;
    }, error => {
      this.isUpdatingResponse = false;
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