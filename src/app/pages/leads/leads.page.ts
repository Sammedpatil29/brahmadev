import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonRefresher, IonRefresherContent, IonCard, IonCardContent, IonBadge, IonSpinner } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, call, image, navigateCircle, navigateCircleOutline, logoFacebook, callOutline, locationOutline, timeOutline, logoInstagram, globeOutline } from 'ionicons/icons';
import { Leads } from 'src/app/services/leads';

@Component({
  selector: 'app-leads',
  templateUrl: './leads.page.html',
  styleUrls: ['./leads.page.scss'],
  standalone: true,
  imports: [IonSpinner, IonBadge, IonCardContent, IonCard, IonRefresherContent, IonRefresher, IonIcon, IonButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class LeadsPage implements OnInit {


  leads: any
  isLoading:boolean = false
  constructor(private navCtrl: NavController, private service: Leads) {
    addIcons({arrowBackOutline,logoFacebook,logoInstagram,globeOutline,callOutline,locationOutline,timeOutline,call,navigateCircleOutline,image,navigateCircle}); 
   }

  ngOnInit() {
    this.getLeads()
  }

   back(){
    this.navCtrl.back()
  }

  getLeads(event?: any) {
  this.isLoading = true;
  this.service.getLeads().subscribe({
    next: (res: any) => {
      this.leads = res;
      this.isLoading = false;

      // This tells the UI to stop rotating and close the refresher
      if (event) {
        event.target.complete();
      }
    },
    error: (err) => {
      this.isLoading = false;
      // Complete the event even on error to avoid a stuck spinner
      if (event) {
        event.target.complete();
      }
    }
  });
  }

  viewLead(arg0: any) {
// this.navCtrl.navigateForward('/layout/lead-details')
}

handleRefresh(event: any) {
  // Pass the event to your fetching logic
  this.getLeads(event);
}

//   updateLeadData() {
//   const payload = {
//     response: this.selectedLead.response,
//     city: this.selectedLead.city,
//     newComment: this.tempComment
//   };

//   this.service.updateLead(this.selectedLead.id, payload).subscribe(() => {
//     this.showToast('Lead updated successfully!');
//     this.tempComment = ''; // Clear the comment box
//     this.loadLeads();      // Refresh list
//   });
// }

}
