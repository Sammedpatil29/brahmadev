import { Component, OnInit, signal } from '@angular/core';
import { AlertController, NavController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, downloadOutline, flaskOutline, mailOutline, trashOutline } from 'ionicons/icons';
import { IonHeader, IonContent, IonToolbar, IonButtons, IonButton, IonIcon, IonTitle, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonNote, IonCardContent, IonSpinner, IonSearchbar } from "@ionic/angular/standalone";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Leads } from 'src/app/services/leads';
import { Filesystem, Directory } from '@capacitor/filesystem';

@Component({
  selector: 'app-quotations-list',
  templateUrl: './quotations-list.page.html',
  styleUrls: ['./quotations-list.page.scss'],
  imports: [IonSearchbar, IonSpinner, IonButtons, IonContent, IonHeader, IonToolbar, IonButton, IonIcon, IonTitle, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonNote, IonCardContent, FormsModule, CommonModule],
})
export class QuotationsListPage implements OnInit {

  quotations: any = signal([]);
  isLoading: boolean = false;
  isDownloading: boolean = false;

  constructor(
    private navCtrl: NavController,
    private alertController: AlertController,
    private toastController: ToastController,
    private leads: Leads
  ) {
    addIcons({ arrowBackOutline, downloadOutline, mailOutline, trashOutline });
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.loadQuotations();
  }

  loadQuotations() {
    this.isLoading = true;
    this.leads.getQuotations().subscribe((res: any) => {
      this.quotations.set(res);
      this.isLoading = false
    }, error => {
      console.error('Error fetching quotations:', error);
      this.presentToast('Failed to load quotations.');
      this.isLoading = false;
    });
  }

  back() {
    this.navCtrl.back();
  }

  async download(item: any) {
    this.isDownloading = true;
  try {
    const response = await fetch(item.url);
    const blob = await response.blob();

    const base64 = await this.convertBlobToBase64(blob) as string;

    const fileName = `${item.quoteId}_${item.customerName}.pdf`;

    await Filesystem.writeFile({
      path: fileName,
      data: base64.split(',')[1], // remove data prefix
      directory: Directory.Documents,
    });
    this.isDownloading = false;
    this.presentToast('PDF downloaded successfully!');
  } catch (error) {
    this.isDownloading = false;
    console.error(error);
    this.presentToast('Download failed');
  }
}

convertBlobToBase64 = (blob: Blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};

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
            this.leads.deleteQuotation(item.id).subscribe(() => {
              this.loadQuotations();
              this.presentToast('Quotation deleted.');
            }, error => {              
              console.error('Error deleting quotation:', error);
              this.presentToast('Failed to delete quotation.');
            });
            
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

  search(event: any) {
    const query = event.target.value.toLowerCase();
    if (!query) {
      this.loadQuotations();
      return;
    }
    const filtered = this.quotations().filter((q: any) =>
      q.customerName.toLowerCase().includes(query) ||
      q.quoteId.toString().includes(query)
    );
    this.quotations.set(filtered);
  }
}
