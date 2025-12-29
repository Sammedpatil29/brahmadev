import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonToggle } from '@ionic/angular/standalone';
// import { SocketService } from 'src/app/services/socket';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonToggle, IonLabel, IonItem, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class HomePage implements OnInit {

  status: boolean = false
  riderData: any
  rideRequests:any
greeting: string = '';

  constructor(private navCtrl: NavController ) { }

  ngOnInit() {
    // this.startTimeCounter();
    this.setGreeting();
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
}
