import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonRefresher, IonRefresherContent, IonCard, IonCardContent, IonBadge, IonSpinner, IonSearchbar, IonDatetimeButton, IonInfiniteScroll, IonInfiniteScrollContent } from '@ionic/angular/standalone';
import { NavController, ActionSheetController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, call, image, navigateCircle, navigateCircleOutline, logoFacebook, callOutline, locationOutline, timeOutline, logoInstagram, globeOutline, personAddOutline } from 'ionicons/icons';
import { Leads } from 'src/app/services/leads';
import { SocketService } from 'src/app/services/socket';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-leads',
  templateUrl: './leads.page.html',
  styleUrls: ['./leads.page.scss'],
  standalone: true,
  imports: [IonInfiniteScrollContent, IonInfiniteScroll, IonDatetimeButton, IonSearchbar, IonSpinner, IonBadge, IonCardContent, IonCard, IonRefresherContent, IonRefresher, IonIcon, IonButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class LeadsPage implements OnInit, OnDestroy {

  leads: any
  searchTerm: string = 'new';
  filteredLeads: any[] = [];
  displayedLeads: any[] = [];
  response: any = []
  newLeads: any
  isLoading: boolean = false

  private batchSize = 20;
  private socketSubscription?: Subscription;
  private leadUpdateSubscription?: Subscription;

  constructor(
    private navCtrl: NavController, 
    private service: Leads, 
    private actionSheetCtrl: ActionSheetController, 
    private route: ActivatedRoute,
    private socketService: SocketService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({arrowBackOutline,personAddOutline,logoFacebook,logoInstagram,globeOutline,callOutline,locationOutline,timeOutline,call,navigateCircleOutline,image,navigateCircle}); 
  }

  ngOnInit() {
    this.route.queryParams.subscribe((item:any)=>{
      if (item['filter'] === 'scheduled') {
        this.searchTerm = 'scheduled';
        this.handleSearch(); 
      }
    });
    this.getLeads(true);

    // Listen to real-time incoming leads via Socket.IO and push to leads list dynamically
    this.socketSubscription = this.socketService.onNewLead().subscribe((leadData: any) => {
      if (leadData) {
        this.ngZone.run(() => {
          this.handleIncomingSocketLead(leadData);
        });
      }
    });

    // Listen to real-time lead updates (status changes, comments, etc.)
    this.leadUpdateSubscription = this.socketService.onLeadUpdate().subscribe((updateData: any) => {
      if (updateData && Array.isArray(this.leads)) {
        this.ngZone.run(() => {
          const leadId = updateData.leadId || updateData.lead?.id;
          const target = this.leads.find((l: any) => String(l.id) === String(leadId) || String(l._id) === String(leadId));
          if (target) {
            if (updateData.response || updateData.lead?.response) {
              target.response = updateData.response || updateData.lead.response;
            }
            if (updateData.lead?.comment || updateData.comment) {
              target.comment = updateData.lead?.comment || updateData.comment;
            }
            if (updateData.lead?.visit_schedule !== undefined) {
              target.visit_schedule = updateData.lead.visit_schedule;
            }
            if (updateData.lead?.access !== undefined) {
              target.access = updateData.lead.access;
            }
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  ngOnDestroy() {
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }
    if (this.leadUpdateSubscription) {
      this.leadUpdateSubscription.unsubscribe();
    }
  }

  handleIncomingSocketLead(newLead: any) {
    if (!newLead) return;

    if (!Array.isArray(this.leads)) {
      this.leads = [];
    }

    // Check if lead already exists in list to avoid duplicate entries
    const exists = this.leads.some((l: any) => 
      (l.id && (l.id === newLead.id || l.id === newLead._id)) || 
      (l._id && (l._id === newLead._id || l._id === newLead.id)) ||
      (l.contact && l.contact === newLead.contact && l.name === newLead.name)
    );

    if (exists) {
      return;
    }

    // Standardize lead object fields
    const formattedLead = {
      ...newLead,
      id: newLead.id || newLead._id || Date.now().toString(),
      name: newLead.name || 'New Customer',
      contact: newLead.contact || '',
      city: newLead.city || '',
      access: Array.isArray(newLead.access) ? newLead.access : [],
      visit_schedule: newLead.visit_schedule || null,
      response: newLead.response || 'new',
      platform: newLead.platform || 'manual'
    };

    // Push new lead to the beginning of the list
    this.leads.unshift(formattedLead);

    // Update new leads count filter
    this.newLeads = this.leads.filter((item: any) => item.response === 'new');

    // Update category response chips
    this.getResponseList();

    // Re-apply current search/filter view so the new lead immediately appears in displayedLeads
    this.handleSearch();

    this.cdr.detectChanges();
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
    if (!Array.isArray(this.leads)) {
      this.filteredLeads = [];
      this.resetDisplayedLeads();
      return;
    }

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
        return Array.isArray(lead.access) && lead.access.length > 0;
      });
      this.resetDisplayedLeads();
      return;
    }

    this.filteredLeads = this.leads.filter((lead: any) => {
      const name = (lead.name || '').toLowerCase();
      const city = (lead.city || '').toLowerCase();
      const contact = String(lead.contact || '').toLowerCase();
      const response = (lead.response || '').toLowerCase();
      return name.includes(query) || 
             city.includes(query) ||
             contact.includes(query) ||
             response.includes(query);
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
