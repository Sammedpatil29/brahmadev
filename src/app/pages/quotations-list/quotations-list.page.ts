import { Component, OnInit, signal } from '@angular/core';
import { AlertController, NavController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, downloadOutline, flaskOutline, mailOutline, trashOutline } from 'ionicons/icons';
import { IonHeader, IonContent, IonToolbar, IonButtons, IonButton, IonIcon, IonTitle, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonNote, IonCardContent, IonSpinner, IonSearchbar } from "@ionic/angular/standalone";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Leads } from 'src/app/services/leads';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Http, HttpDownloadFileResult } from '@capacitor-community/http';
import { Directory, Filesystem } from '@capacitor/filesystem';

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
    private leads: Leads,
    private http: HttpClient
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

 
  async checkPermissions() {
  const status = await Filesystem.checkPermissions();
  if (status.publicStorage !== 'granted') {
    await Filesystem.requestPermissions();
  }
}



async download(item: any) {
  await this.checkPermissions();
  this.isDownloading = true;

  try {
    // 1. Define the destination path on the device
    const fileName = `${item.quoteId}_${item.customerName.replace(/\s+/g, '_')}.pdf`;

    // 2. Use Native HTTP to download directly to the Filesystem
    // This bypasses CORS and handles the binary data automatically
    const options = {
      url: item.url,
      filePath: fileName, // The name it will be saved as
      directory: Directory.Documents, // Saves to the device Documents folder
    };

    const response: HttpDownloadFileResult = await Http.downloadFile(options);

    if (response.path) {
      this.isDownloading = false;
      this.presentToast('PDF downloaded successfully to Documents!');
      
      // Optional: Log the path to see where it went
      console.log('File saved at:', response.path);
    }

  } catch (error:any) {
    this.isDownloading = false;
    console.error('Download error:', error);
    
    // Check if the error is due to the 403 Forbidden rules we discussed
    if (error.toString().includes('403')) {
      this.presentToast('Access Denied: Please check Firebase Security Rules.');
    } else {
      this.presentToast('Download failed. Check your connection.');
    }
  }
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
