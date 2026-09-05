import { Component, OnInit, signal } from '@angular/core';
import { AlertController, NavController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, downloadOutline, flaskOutline, mailOutline, trashOutline, documentTextOutline, calendarOutline, closeCircleOutline, filterOutline, checkmarkOutline } from 'ionicons/icons';
import { IonHeader, IonContent, IonToolbar, IonButtons, IonButton, IonIcon, IonTitle, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonNote, IonCardContent, IonSpinner, IonSearchbar, IonModal } from "@ionic/angular/standalone";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Leads } from 'src/app/services/leads';
import { HttpClient } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

@Component({
  selector: 'app-quotations-list',
  templateUrl: './quotations-list.page.html',
  styleUrls: ['./quotations-list.page.scss'],
  imports: [IonModal, IonSearchbar, IonSpinner, IonButtons, IonContent, IonHeader, IonToolbar, IonButton, IonIcon, IonTitle, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonNote, IonCardContent, FormsModule, CommonModule],
})
export class QuotationsListPage implements OnInit {

  quotations: any = signal([]);
  allQuotations: any[] = [];
  searchTerm: string = '';
  
  // Date Range Filter
  startDate: string = ''; // YYYY-MM-DD
  endDate: string = '';   // YYYY-MM-DD
  tempStartDate: string = '';
  tempEndDate: string = '';
  isDateModalOpen: boolean = false;

  isLoading: boolean = false;
  downloadingId: any = null;

  constructor(
    private navCtrl: NavController,
    private alertController: AlertController,
    private toastController: ToastController,
    private leads: Leads,
    private http: HttpClient
  ) {
    addIcons({ arrowBackOutline, downloadOutline, mailOutline, trashOutline, documentTextOutline, calendarOutline, closeCircleOutline, filterOutline, checkmarkOutline });
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.loadQuotations();
  }

  loadQuotations() {
    this.isLoading = true;
    this.leads.getQuotations().subscribe((res: any) => {
      this.allQuotations = res || [];
      this.handleSearch();
      this.isLoading = false;
    }, error => {
      console.error('Error fetching quotations:', error);
      this.presentToast('Failed to load quotations.');
      this.isLoading = false;
    });
  }

  openDateModal() {
    this.tempStartDate = this.startDate;
    this.tempEndDate = this.endDate;
    this.isDateModalOpen = true;
  }

  closeDateModal() {
    this.isDateModalOpen = false;
  }

  applyDateFilter() {
    if (this.tempStartDate && this.tempEndDate && this.tempStartDate > this.tempEndDate) {
      this.presentToast('Start date cannot be after end date.');
      return;
    }
    this.startDate = this.tempStartDate;
    this.endDate = this.tempEndDate;
    this.isDateModalOpen = false;
    this.handleSearch();
  }

  clearDateFilter() {
    this.startDate = '';
    this.endDate = '';
    this.tempStartDate = '';
    this.tempEndDate = '';
    this.isDateModalOpen = false;
    this.handleSearch();
  }

  get isDateFilterActive(): boolean {
    return !!(this.startDate || this.endDate);
  }

  get dateRangeLabel(): string {
    if (this.startDate && this.endDate) {
      return `${this.formatDisplayDate(this.startDate)} - ${this.formatDisplayDate(this.endDate)}`;
    } else if (this.startDate) {
      return `From ${this.formatDisplayDate(this.startDate)}`;
    } else if (this.endDate) {
      return `Until ${this.formatDisplayDate(this.endDate)}`;
    }
    return 'Filter by Date';
  }

  private formatDisplayDate(isoDateStr: string): string {
    if (!isoDateStr) return '';
    const parts = isoDateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    }
    return isoDateStr;
  }

  back() {
    this.navCtrl.back();
  }

  async download(item: any) {
    if (!item) return;
    this.downloadingId = item.id;

    try {
      const cleanCustomer = (item.customerName || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
      const cleanQuoteId = (item.quoteId || 'Quote').replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${cleanQuoteId}_${cleanCustomer}.pdf`;

      // 1. Fetch PDF binary from backend download stream or direct URL fallback
      let blob: Blob | null = null;
      const downloadEndpoint = `${this.leads.url}/quotations/${item.id}/download`;

      try {
        const response = await fetch(downloadEndpoint);
        if (response.ok) {
          blob = await response.blob();
        } else {
          console.warn(`Backend download returned status ${response.status}`);
        }
      } catch (endpointErr) {
        console.warn('Backend download endpoint error:', endpointErr);
      }

      // Fallback: If backend stream failed, try fetching directly from item.url
      if (!blob && item.url) {
        try {
          const directRes = await fetch(item.url);
          if (directRes.ok) {
            blob = await directRes.blob();
          }
        } catch (directErr) {
          console.warn('Direct URL fetch failed:', directErr);
        }
      }

      // 2. Handle download/share if blob was retrieved
      if (blob) {
        if (Capacitor.isNativePlatform()) {
          const base64Data = await this.blobToBase64(blob);
          const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache
          });

          await Share.share({
            title: fileName,
            url: savedFile.uri,
            dialogTitle: 'Share Quotation PDF'
          });

          await this.presentToast('Quotation PDF ready!');
        } else {
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);

          await this.presentToast('Quotation PDF downloaded successfully!');
        }
      } else {
        // Fallback if binary could not be fetched (e.g. strict external CORS on web)
        if (!Capacitor.isNativePlatform() && item.url) {
          window.open(item.url, '_blank');
          await this.presentToast('Opening quotation PDF in new tab...');
        } else if (Capacitor.isNativePlatform() && item.url) {
          await Share.share({
            title: fileName,
            url: item.url,
            dialogTitle: 'Share Quotation PDF'
          });
        } else {
          throw new Error('PDF file not accessible');
        }
      }

    } catch (error: any) {
      console.error('Download error:', error);
      await this.presentToast('Failed to download quotation PDF. Please try again.');
    } finally {
      this.downloadingId = null;
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
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

  handleSearch() {
    const query = (this.searchTerm || '').toLowerCase().trim();
    
    let filtered = this.allQuotations;

    // Apply start & end date range filter
    if (this.startDate || this.endDate) {
      filtered = filtered.filter((q: any) => {
        const d = q.date ? new Date(q.date) : (q.createdAt ? new Date(q.createdAt) : null);
        if (!d || isNaN(d.getTime())) return false;
        const itemDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        if (this.startDate && itemDateStr < this.startDate) {
          return false;
        }
        if (this.endDate && itemDateStr > this.endDate) {
          return false;
        }
        return true;
      });
    }

    // Apply text search
    if (query) {
      filtered = filtered.filter((q: any) =>
        (q.customerName && q.customerName.toLowerCase().includes(query)) ||
        (q.siteAddress && q.siteAddress.toLowerCase().includes(query)) ||
        (q.contact && q.contact.toLowerCase().includes(query)) ||
        (q.email && q.email.toLowerCase().includes(query)) ||
        (q.quoteId && q.quoteId.toString().toLowerCase().includes(query))
      );
    }

    this.quotations.set(filtered);
  }

  resetSearch() {
    this.searchTerm = '';
    this.startDate = '';
    this.endDate = '';
    this.handleSearch();
  }
}
