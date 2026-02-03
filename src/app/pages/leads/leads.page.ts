import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonRefresher, IonRefresherContent, IonCard, IonCardContent, IonBadge, IonSpinner, IonSearchbar, IonDatetimeButton } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, call, image, navigateCircle, navigateCircleOutline, logoFacebook, callOutline, locationOutline, timeOutline, logoInstagram, globeOutline, personAddOutline } from 'ionicons/icons';
import { Leads } from 'src/app/services/leads';
import { ActionSheetController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-leads',
  templateUrl: './leads.page.html',
  styleUrls: ['./leads.page.scss'],
  standalone: true,
  imports: [IonDatetimeButton, IonSearchbar, IonSpinner, IonBadge, IonCardContent, IonCard, IonRefresherContent, IonRefresher, IonIcon, IonButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class LeadsPage implements OnInit {


  leads: any
  searchTerm: string = 'new';     // Your master data from the API
  filteredLeads: any[] = [];
  response : any = []
  newLeads: any
  isLoading:boolean = false
  constructor(private navCtrl: NavController, private service: Leads, private actionSheetCtrl: ActionSheetController, private route: ActivatedRoute) {
    addIcons({arrowBackOutline,personAddOutline,logoFacebook,logoInstagram,globeOutline,callOutline,locationOutline,timeOutline,call,navigateCircleOutline,image,navigateCircle}); 
   }

  ngOnInit() {
    this.route.queryParams.subscribe((item:any)=>{
      if (item['filter'] === 'scheduled') {
      this.searchTerm = 'scheduled';
      // Ensure leads are loaded before searching
      this.handleSearch(); 
    }
    })
    this.getLeads()
  }

   back(){
    this.navCtrl.back()
  }

  ionViewWillEnter() {
    this.getLeads();
    // this.handleSearch()
  }

  getLeads(event?: any) {
  this.isLoading = true;
  this.service.getLeads().subscribe({
    next: (res: any) => {
      this.leads = res;
      this.filteredLeads = this.leads
      this.newLeads = this.leads.filter((item:any)=>item.response === 'new')
      this.handleSearch()
      this.getResponseList()
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

  getResponseList(){
    this.response = []
    this.leads.forEach((item:any)=>{
      if(!this.response.includes(item.response)){
        if(item.response == 'new'){
          this.response.unshift(item.response)
        } else {
           this.response.push(item.response)
        }
      }
    })
  }

  viewLead(arg0: any) {
this.navCtrl.navigateForward(['/layout/lead-details'], {
    queryParams: { id: arg0 }
  });
}

handleRefresh(event: any) {
  // Pass the event to your fetching logic
  this.getLeads(event);
}

resetSearch(){
  this.searchTerm = ''
  this.handleSearch()
}

scheduledSearch(){
  this.searchTerm = 'scheduled'
  this.handleSearch()
}

externalSearch(){
  this.searchTerm = 'external'
  this.handleSearch()
}

handleSearch() {
  const query = this.searchTerm.toLowerCase().trim();

  if (!query) {
    // If search is empty, show everything
    this.filteredLeads = [...this.leads];
    return;
  }

  // --- NEW FUNCTIONALITY START ---
  if (query === 'scheduled') {
    this.filteredLeads = this.leads.filter((lead: any) => {
      // Check for both null and empty string to be safe
      return lead.visit_schedule !== null && lead.visit_schedule !== '';
    });
    return; // Exit here so the old functionality below doesn't overwrite this
  }

  if (query === 'external') {
    this.filteredLeads = this.leads.filter((lead: any) => {
      // Check for both null and empty string to be safe
      return lead.access.length > 0;
    });
    return; // Exit here so the old functionality below doesn't overwrite this
  }
  // --- NEW FUNCTIONALITY END ---

  // Old Functionality (untouched logic, just executes if not 'scheduled')
  this.filteredLeads = this.leads.filter((lead: any) => {
    return lead.name.toLowerCase().includes(query) || 
           lead.city.toLowerCase().includes(query) ||
           lead.contact.toLowerCase().includes(query) ||
           lead.response.toLowerCase().includes(query);
  });
}

  filterbyChips(chips:any){
    this.searchTerm = chips
    this.handleSearch()
  }

  addLead(){
    this.navCtrl.navigateForward('/layout/add-lead')
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
