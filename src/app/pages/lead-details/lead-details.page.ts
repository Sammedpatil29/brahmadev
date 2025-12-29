import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonButton, IonList, IonItem, IonLabel, IonInput, IonIcon, IonFooter, IonSelectOption, IonTextarea, IonModal, IonSpinner } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, call, callOutline, globeOutline, image, locationOutline, logoFacebook, logoInstagram, navigateCircle, navigateCircleOutline, timeOutline, send, journalOutline, sendSharp, chatboxEllipsesOutline, cloudOfflineOutline, checkmarkCircleOutline, calendarOutline, documentTextOutline, trophyOutline, closeCircleOutline, personCircle, copyOutline } from 'ionicons/icons';
import { Leads } from 'src/app/services/leads';
import { ActivatedRoute } from '@angular/router';
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
id: any;
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
  'Wrong Number'
];
editData:any;
  constructor(private navCtrl: NavController, private service: Leads, private route: ActivatedRoute, private toastController: ToastController) {
    addIcons({arrowBackOutline,callOutline,copyOutline,locationOutline,chatboxEllipsesOutline,send,personCircle,checkmarkCircleOutline,calendarOutline,documentTextOutline,trophyOutline,closeCircleOutline,cloudOfflineOutline,journalOutline,sendSharp,logoFacebook,logoInstagram,globeOutline,timeOutline,call,navigateCircleOutline,image,navigateCircle});
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
this.service.updateLeads(params, this.lead.id).subscribe((res:any)=>{
    this.lead = res
    this.newComment = ''
  })
  }
}

updateStatus(arg0: string) {
  let params = {
    "response": arg0
  }
this.service.updateLeads(params, this.lead.id).subscribe((res:any)=>{
    this.lead = res
  })
}
isLoading: boolean = false
getLeadDetails(){
  this.isLoading = true
  this.service.getLeadDetails(this.id).subscribe((res:any)=>{
    this.lead = res
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

}
