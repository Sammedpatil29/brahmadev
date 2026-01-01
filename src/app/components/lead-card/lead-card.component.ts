import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonIcon, IonCard, IonCardContent, IonBadge } from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { arrowBackOutline, call, image, navigateCircle, navigateCircleOutline, logoFacebook, callOutline, locationOutline, timeOutline, logoInstagram, globeOutline } from 'ionicons/icons';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-lead-card',
  templateUrl: './lead-card.component.html',
  styleUrls: ['./lead-card.component.scss'],
  imports: [IonBadge, IonCardContent, IonCard, IonIcon,  IonCard, IonCardContent, FormsModule, CommonModule],
})
export class LeadCardComponent  implements OnInit {
@Input() lead:any;


  constructor(private navCtrl: NavController) { 
    addIcons({arrowBackOutline,logoFacebook,logoInstagram,globeOutline,callOutline,locationOutline,timeOutline,call,navigateCircleOutline,image,navigateCircle}); 
  }

  ngOnInit() {}

 viewLead() {
this.navCtrl.navigateForward('/layout/leads', {
  queryParams: {
    filter: 'scheduled'
  }
})
}

}
