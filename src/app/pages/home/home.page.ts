import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonToggle, IonBadge, IonIcon, IonCard, IonCardContent } from '@ionic/angular/standalone';
// import { SocketService } from 'src/app/services/socket';
import { NavController } from '@ionic/angular';
import { Leads } from 'src/app/services/leads';
import { Fcm } from 'src/app/services/fcm';
import { register } from 'swiper/element/bundle';
import { Capacitor } from '@capacitor/core';
import { LeadCardComponent } from "src/app/components/lead-card/lead-card.component";
register();

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonCardContent, IonCard, IonIcon, IonBadge, IonToggle, IonLabel, IonItem, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, LeadCardComponent]
})
export class HomePage implements OnInit {


  status: boolean = false
  isLoading: boolean = false
  riderData: any
  rideRequests:any
  newLeads:any = 0
greeting: string = '';

lead: any;

  constructor(private navCtrl: NavController, private service: Leads, private fcmService: Fcm ) { }

  ngOnInit() {
    // this.startTimeCounter();
    this.setGreeting();
    this.newLeadsCount()
    // if (Capacitor.isNativePlatform()) {
    //   this.fcmService.initPush()
    // }
    
  }

  scroll(direction: 'left' | 'right') {
  const container = document.querySelector('.swipe-container');
  if (container) {
    const scrollAmount = container.clientWidth * 0.9; // Match your card width
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  }
}

  ionViewDidEnter() {
    this.newLeadsCount()
  }

   ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }


  time: any;
  intervalId: any;

  startTimeCounter() {
    this.intervalId = setInterval(() => {
      const now = new Date();
      // Format time as HH:MM:SS
      this.time = now.toLocaleTimeString('en-US', { hour12: true }).toUpperCase();
    }, 1000);
  }

  navigate(route:any){
    this.navCtrl.navigateForward(`/layout/${route}`);
  }

  logout(){
    localStorage.removeItem('userToken')
    localStorage.removeItem('userName')
    this.navCtrl.navigateRoot('/login')
  }

 setGreeting() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    this.greeting = 'Hello, Good Morning ☕';
  } else if (hour >= 12 && hour < 17) {
    this.greeting = 'Hello, Good Afternoon ☀️';
  } else if (hour >= 17 && hour < 21) {
    this.greeting = 'Hello, Good Evening 🌇';
  } else {
    this.greeting = 'Hello, Good Night 🌙';
  }
}

newLeadsCount(){
  this.isLoading = true
  this.service.getLeadCountNew().subscribe((res:any)=>{
    this.lead = res;
    this.isLoading = false;
  })
}


}
