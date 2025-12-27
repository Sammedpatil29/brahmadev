import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonSpinner, IonButtons, IonButton } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { HttpClient, httpResource } from '@angular/common/http';
import { Login } from 'src/app/services/login';

import { 
  arrowBackOutline, 
  locationOutline, 
  imagesOutline, 
  callOutline, 
  documentTextOutline, navigateCircle, call, image, navigateCircleOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: true,
  imports: [IonButton, IonButtons, IonSpinner, IonIcon, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class HistoryPage implements OnInit {
pastVisits: any = []
titlecase: any;
isLoading: boolean = false
  constructor(private navCtrl: NavController, private loginService: Login, private http: HttpClient) {
      addIcons({arrowBackOutline,call,navigateCircleOutline,image,navigateCircle}); 
    
  }

  ngOnInit() {
    this.getVisits()
  }

  back(){
    this.navCtrl.back()
  }

  gotoAdd(){
    this.navCtrl.navigateRoot('/layout/add-visit')
  }

  async getVisits(){
    this.isLoading = true
    const token = await localStorage.getItem('userToken')
    this.loginService.getVisits({token}).subscribe((res:any) => {
      this.pastVisits = res.user_visits.reverse()
      this.isLoading = false
    }, error => {
      this.isLoading = false
    })
  }

  openMap(lat: number, lng: number) {
  // Construct the Google Maps URL
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  console.log(url)

  // Open in new tab (browser) or in system app on mobile
  window.open(url, '_blank');
}

images: any = []
showPreview: boolean = false
openImage(item: any) {
  this.showPreview = true;

  // Clone locationImage to avoid modifying original
  this.images = [...item.locationImage];

  // Add selfie only once
  this.images.push(item.selfie);
}



}
