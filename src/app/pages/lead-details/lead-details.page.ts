import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonButton, IonList, IonItem, IonLabel, IonInput, IonIcon, IonFooter, IonSelectOption } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-lead-details',
  templateUrl: './lead-details.page.html',
  styleUrls: ['./lead-details.page.scss'],
  standalone: true,
  imports: [IonFooter, IonIcon, IonInput, IonLabel, IonItem, IonList, IonButton, IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonSelectOption]
})
export class LeadDetailsPage implements OnInit {
lead:any = {
  "id": 101,
  "name": "Sudarshan K.",
  "contact": "+91 9876543210",
  "city": "Hubli",
  "response": "Site Visit Scheduled",
  "platform": "fb",
  "time": "2025-12-27T10:45:00Z",
  "createdAt": "2025-12-27T10:45:00.000Z",
  "updatedAt": "2025-12-28T14:20:00.000Z",
  "comment": [
    {
      "author": "System",
      "text": "Lead generated via Meta Ads Form.",
      "date": "2025-12-27T10:45:00Z"
    },
    {
      "author": "Admin",
      "text": "Called the client. He is looking for a 30x40 duplex plan.",
      "date": "2025-12-27T16:30:00Z"
    },
    {
      "author": "Admin",
      "text": "Site visit confirmed for Sunday at 10 AM. Customer changed location to Dharwad site.",
      "date": "2025-12-28T14:20:00Z"
    }
  ]
}
editData:any;
  constructor(private navCtrl: NavController) { }

  ngOnInit() {
  }

  back(){
    this.navCtrl.back()
  }

}
