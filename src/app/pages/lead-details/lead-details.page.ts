import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonButton, IonList, IonItem, IonLabel, IonInput, IonIcon, IonFooter, IonSelectOption, IonTextarea, IonModal, IonSpinner } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, call, callOutline, globeOutline, image, locationOutline, logoFacebook, logoInstagram, navigateCircle, navigateCircleOutline, timeOutline, send, journalOutline, sendSharp, chatboxEllipsesOutline, cloudOfflineOutline, checkmarkCircleOutline, calendarOutline, documentTextOutline, trophyOutline, closeCircleOutline, personCircle, copyOutline } from 'ionicons/icons';
import { Leads } from 'src/app/services/leads';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-lead-details',
  templateUrl: './lead-details.page.html',
  styleUrls: ['./lead-details.page.scss'],
  standalone: true,
  imports: [IonSpinner, IonModal, IonTextarea, IonFooter, IonIcon, IonInput, IonLabel, IonItem, IonList, IonButton, IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonSelectOption]
})
export class LeadDetailsPage implements OnInit {


newComment: any;
isSending:boolean = false
id: any;
scheduledDate = '';
lead:any = {
  "comment": []
}

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
editData:any;
  constructor(private navCtrl: NavController, private service: Leads, private route: ActivatedRoute, private toastController: ToastController, private router: Router) {
    addIcons({arrowBackOutline,callOutline,copyOutline,locationOutline,documentTextOutline,chatboxEllipsesOutline,send,personCircle,checkmarkCircleOutline,calendarOutline,trophyOutline,closeCircleOutline,cloudOfflineOutline,journalOutline,sendSharp,logoFacebook,logoInstagram,globeOutline,timeOutline,call,navigateCircleOutline,image,navigateCircle});
   }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.id = params['id'];
      
      if (this.id) {
        this.getLeadDetails();
      }
    });
  }

  back(){
    this.navCtrl.back()
  }

callNow() {
  if (this.lead && this.lead.contact) {
    // Standard way to trigger the phone dialer
    window.open(`tel:${this.lead.contact}`, '_system');
  } else {
    console.error("No contact number available");
  }
}

saveChanges() {
  if(this.lead.response == 'new'){
    let params = {
  "newComment": this.newComment,
  "response": "Conversion Started",
  "city": "",
  "user": localStorage.getItem('userName')
}
this.service.updateLeads(params, this.lead.id).subscribe((res:any)=>{
    this.lead = res
  })
  } else {
    let params = {
  "newComment": this.newComment,
  "response": "",
  "city": "",
  "user": localStorage.getItem('userName')
}
this.isSending = true
this.service.updateLeads(params, this.lead.id).subscribe((res:any)=>{
    this.lead = res
    this.newComment = ''
    this.isSending = false
  }, error =>{
    this.isSending = false
  })
  }
}

isUpdatingResponse = false
updateStatus(arg0: string) {
  this.isUpdatingResponse = true
  let params = {
    "response": arg0
  }
this.service.updateLeads(params, this.lead.id).subscribe((res:any)=>{
    this.lead = res
    this.isUpdatingResponse = false
  }, error => {
    this.isUpdatingResponse = false
  })
}




isLoading: boolean = false
getLeadDetails(){
  this.isLoading = true
  this.service.getLeadDetails(this.id).subscribe((res:any)=>{
    this.lead = res
    this.statusList = res.status
    this.isLoading = false
  }, error => {
    this.isLoading = false
  })
}

async copyToClipboard(text: string, event: Event) {
  // Prevent the click from triggering any parent item clicks
  event.stopPropagation();

  if (!text) return;

  try {
    // Standard Web API for copying text
    await navigator.clipboard.writeText(text);
    
    // Show success feedback
    // const toast = await this.toastController.create({
    //   message: 'Copied: ' + text,
    //   duration: 2000,
    //   color: 'transparent',
    //   position: 'bottom'
    // });
    // await toast.present();
    
  } catch (err) {
    console.error('Failed to copy: ', err);
    
    // Fallback for older browsers if navigator.clipboard is unavailable
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
      city: this.lead.city // assuming siteAddress is the city
    }
  };
  
  // Navigate to your target route (e.g., 'lead-details')
  this.router.navigate(['layout/quotation'], navigationExtras);
}

// onDateSelected(arg0: string) {
// this.scheduledDate = arg0
// }
// scheduledDate: string = '';
isUpdatingDate = false
onDateTimeSelected(value: string) {
  if (!value) return;

  // 1. Update the local UI state
  this.scheduledDate = value;

  // 2. Prepare parameters for the API
  // We assume 'visit confirmed' is the status when a date/time is picked
  const params = {
    "visit_schedule": value 
  };
this.isUpdatingDate = true
  // 3. Call your service
  this.service.updateLeads(params, this.lead.id).subscribe({
    next: (res: any) => {
      this.lead = res;
      this.isUpdatingDate = false
      console.log('Date and Time updated successfully');
    },
    error: (err) => {
      console.error('Update failed', err);
      this.isUpdatingDate = false
    }
  });
}
}
