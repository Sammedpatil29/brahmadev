import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonButton, IonModal, IonLabel, IonDatetimeButton, IonButtons, IonInput } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, calendarOutline, personAddOutline } from 'ionicons/icons';
import { Leads } from 'src/app/services/leads';

@Component({
  selector: 'app-add-lead',
  templateUrl: './add-lead.page.html',
  styleUrls: ['./add-lead.page.scss'],
  standalone: true,
  imports: [IonInput, IonButtons, IonDatetimeButton, IonLabel, IonModal, IonButton, IonIcon, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class AddLeadPage implements OnInit {

leadName: string = '';
  village: string = '';
  contact: string = '';
  // Default to current date and time in ISO format
  visitDate: string = new Date().toISOString();

  constructor(private navCtrl: NavController, private service: Leads) {
    addIcons({arrowBackOutline,calendarOutline,personAddOutline});
   }

  ngOnInit() {
  }

  back() {
    this.navCtrl.back();
  }
isLoading = false
  saveLead() {
    this.isLoading = true
    var payload = {
    "name": this.leadName,
    "contact": this.contact,
    "city": this.village,
    "time": this.visitDate,
    "platform": 'Direct Contact'
  };
   this.service.saveLead(payload).subscribe((res:any)=>{
    this.leadName = ''
    this.contact = ''
    this.village = ''
    this.isLoading = false
      alert(`New lead ${this.leadName} added Successfully`)
   }, error =>{
    this.isLoading = false
   })
    
  }

  onDateTimeSelected(value: string) {
  if (value) {
    // The native picker returns a string in YYYY-MM-DDTHH:mm format
    this.visitDate = value;
  }
}

}
