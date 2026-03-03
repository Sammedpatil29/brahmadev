import { Component, OnInit } from '@angular/core';
import { AlertController, NavController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, downloadOutline, mailOutline, trashOutline } from 'ionicons/icons';
import { IonHeader, IonContent, IonToolbar, IonButtons, IonButton, IonIcon, IonTitle, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonNote, IonCardContent } from "@ionic/angular/standalone";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-quotations-list',
  templateUrl: './quotations-list.page.html',
  styleUrls: ['./quotations-list.page.scss'],
  imports: [IonButtons, IonContent, IonHeader, IonToolbar, IonButton, IonIcon, IonTitle, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonNote, IonCardContent, FormsModule, CommonModule],
})
export class QuotationsListPage implements OnInit {

  quotations: any[] = [];

  constructor(
    private navCtrl: NavController,
    private alertController: AlertController,
    private toastController: ToastController,
  ) {
    addIcons({ arrowBackOutline, downloadOutline, mailOutline, trashOutline });
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.loadQuotations();
  }

  loadQuotations() {
    // For demonstration, we use localStorage. In a real app, this would be a service call.
    const data = localStorage.getItem('quotations');
    if (data) {
      this.quotations = JSON.parse(data).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    if (this.quotations.length === 0) {
      this.quotations = [
        {
          id: '1',
          customerName: 'Rajesh Kumar',
          siteAddress: 'Plot No. 45, Indiranagar, Bangalore',
          date: new Date().toISOString(),
          grandTotal: 1250000
        },
        {
          id: '2',
          customerName: 'Sneha Gupta',
          siteAddress: 'Flat 302, Green Valley Apts, Mysore',
          date: new Date(Date.now() - 86400000).toISOString(),
          grandTotal: 850000
        },
        {
          id: '3',
          customerName: 'Amit Patel',
          siteAddress: 'Villa 12, Sunshine Enclave, Hubli',
          date: new Date(Date.now() - 172800000).toISOString(),
          grandTotal: 2100000
        }
      ];
    }
  }

  back() {
    this.navCtrl.back();
  }

  download(item: any) {
    console.log('Download:', item);
    this.presentToast('Download functionality not implemented yet.');
    // In a real app, you would generate a PDF and use a file plugin to save it.
  }

  mail(item: any) {
    console.log('Mail:', item);
    this.presentToast('Mail functionality not implemented yet.');
    // In a real app, you would generate a PDF and use an email plugin.
  }

  async delete(item: any) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete the quotation for "${item.customerName}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
          cssClass: 'danger',
          handler: () => {
            this.quotations = this.quotations.filter(q => q.id !== item.id);
            localStorage.setItem('quotations', JSON.stringify(this.quotations));
            this.presentToast('Quotation deleted.');
          },
        },
      ],
    });

    await alert.present();
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
    });
    toast.present();
  }
}