import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonRefresher, IonRefresherContent, IonCard, IonCardContent, IonBadge, IonSpinner, IonSearchbar, IonDatetimeButton, IonInfiniteScroll, IonInfiniteScrollContent } from '@ionic/angular/standalone';
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
  imports: [IonInfiniteScrollContent, IonInfiniteScroll, IonDatetimeButton, IonSearchbar, IonSpinner, IonBadge, IonCardContent, IonCard, IonRefresherContent, IonRefresher, IonIcon, IonButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class LeadsPage implements OnInit {

  leads: any
  searchTerm: string = 'new';
  filteredLeads: any[] = [];
  displayedLeads: any[] = [];
  response: any = []
  newLeads: any
  isLoading: boolean = false

  private batchSize = 20;

  constructor(private navCtrl: NavController, private service: Leads, private actionSheetCtrl: ActionSheetController, private route: ActivatedRoute) {
    addIcons({arrowBackOutline,personAddOutline,logoFacebook,logoInstagram,globeOutline,callOutline,locationOutline,timeOutline,call,navigateCircleOutline,image,navigateCircle}); 
   }

  ngOnInit() {
    this.route.queryParams.subscribe((item:any)=>{
      if (item['filter'] === 'scheduled') {
      this.searchTerm = 'scheduled';
      this.handleSearch(); 
    }
    })
    this.getLeads(true)
  }

   back(){
    this.navCtrl.back()
  }

  ionViewWillEnter() {
    this.getLeads(false);
  }

  getLeads(reload: boolean, event?: any) {
    if (reload) {
      this.isLoading = true;
    }
    this.service.getLeads().subscribe({
      next: (res: any) => {
        this.leads = res;
        this.filteredLeads = this.leads
        this.newLeads = this.leads.filter((item:any)=>item.response === 'new')
        this.handleSearch()
        this.getResponseList()
        this.isLoading = false;

        if (event) {
          event.target.complete();
        }
      },
      error: (err) => {
        this.isLoading = false;
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
    this.getLeads(true, event);
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
      this.filteredLeads = [...this.leads];
      this.resetDisplayedLeads();
      return;
    }

    if (query === 'scheduled') {
      this.filteredLeads = this.leads.filter((lead: any) => {
        return lead.visit_schedule !== null && lead.visit_schedule !== '';
      });
      this.resetDisplayedLeads();
      return;
    }

    if (query === 'external') {
      this.filteredLeads = this.leads.filter((lead: any) => {
        return lead.access.length > 0;
      });
      this.resetDisplayedLeads();
      return;
    }

    this.filteredLeads = this.leads.filter((lead: any) => {
      return lead.name.toLowerCase().includes(query) || 
             lead.city.toLowerCase().includes(query) ||
             lead.contact.toLowerCase().includes(query) ||
             lead.response.toLowerCase().includes(query);
    });
    this.resetDisplayedLeads();
  }

  /** Reset displayed leads to the first batch */
  resetDisplayedLeads() {
    this.displayedLeads = this.filteredLeads.slice(0, this.batchSize);
  }

  /** Load the next batch when user scrolls to the bottom */
  loadMore(event: any) {
    const currentLength = this.displayedLeads.length;
    const nextBatch = this.filteredLeads.slice(currentLength, currentLength + this.batchSize);
    this.displayedLeads = [...this.displayedLeads, ...nextBatch];

    event.target.complete();

    // Disable infinite scroll if all items are loaded
    if (this.displayedLeads.length >= this.filteredLeads.length) {
      event.target.disabled = true;
    }
  }

  filterbyChips(chips:any){
    this.searchTerm = chips
    this.handleSearch()
  }

  addLead(){
    this.navCtrl.navigateForward('/layout/add-lead')
  }

}
