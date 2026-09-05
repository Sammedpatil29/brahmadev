import { Component, OnInit } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import {
  IonHeader,
  IonLabel,
  IonToolbar,
  IonButton,
  IonInput,
  IonItem,
  IonContent,
  IonIcon,
  IonButtons,
  IonTitle,
  IonModal,
  IonList,
  IonCheckbox,
  IonSearchbar,
  IonSpinner,
  IonFooter
} from "@ionic/angular/standalone";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavController, ToastController } from '@ionic/angular';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  logoWhatsapp,
  trashOutline,
  settingsOutline,
  downloadOutline,
  closeOutline,
  eyeOutline,
  documentTextOutline,
  addOutline,
  checkmarkOutline,
  checkmarkCircle,
  addCircleOutline
} from 'ionicons/icons';
import { Router } from '@angular/router';
import { Leads } from '../../services/leads';

@Component({
  selector: 'app-quotation',
  templateUrl: './quotation.page.html',
  styleUrls: ['./quotation.page.scss'],
  standalone: true,
  imports: [
    IonSearchbar,
    IonTitle,
    FormsModule,
    CommonModule,
    IonButtons,
    IonIcon,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonToolbar,
    IonButton,
    IonHeader,
    IonModal,
    IonList,
    IonCheckbox,
    IonSpinner,
    IonFooter
  ],
})
export class QuotationPage implements OnInit {
  // Configurable rates
  gstPercentage: number = 18;
  discountPercentage: number = 10;
  showSettings: boolean = false;
  isItemModalOpen: boolean = false;
  isLoading: boolean = false;

  // Form Fields
  customerName: string = '';
  siteAddress: string = '';
  contact: string = '';
  email: string = '';
  customerGst: string = '';

  // Items
  availableItems: any[] = [];
  selectedItems: any[] = [];
  itemSearchQuery: string = '';

  // New Item Creation Modal (Desktop Catalog)
  isNewItemModalOpen: boolean = false;
  newItem: any = { description: '', price: null, unit: '', gst: 18 };
  isSavingItem: boolean = false;

  invoiceBundle: any = {
    quoteId: '',
    customerName: this.customerName,
    siteAddress: this.siteAddress,
    contact: this.contact,
    email: this.email,
    date: new Date().toISOString(),
    grandTotal: 0,
    base64: ''
  };

  // PDF Preview & Export State
  isPreviewModalOpen = false;
  pdfPreviewSafeUrl: SafeResourceUrl | null = null;
  pdfBlobUrl: string | null = null;
  currentGeneratedDoc: jsPDF | null = null;
  previewTitle = '';
  currentFileName = '';
  currentQuoteId = '';
  isGeneratingPdf = false;

  constructor(
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private sanitizer: DomSanitizer,
    private router: Router,
    private leads: Leads
  ) {
    addIcons({
      arrowBackOutline,
      logoWhatsapp,
      trashOutline,
      settingsOutline,
      downloadOutline,
      closeOutline,
      eyeOutline,
      documentTextOutline,
      addOutline,
      checkmarkOutline,
      checkmarkCircle,
      addCircleOutline
    });
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.customerName = navigation.extras.state['customerName'] || '';
      this.contact = navigation.extras.state['contact'] || '';
      this.siteAddress = navigation.extras.state['city'] || '';
      this.email = navigation.extras.state['email'] || '';
    }
  }

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems() {
    this.leads.getItems().subscribe((res: any) => {
      this.availableItems = res.map((item: any) => ({ ...item, selected: false, quantity: 1 }));
    });
  }

  openNewItemModal() {
    this.newItem = { description: '', price: null, unit: 'sqft', gst: 18 };
    this.isNewItemModalOpen = true;
  }

  closeNewItemModal() {
    this.isNewItemModalOpen = false;
  }

  saveNewItem() {
    if (!this.newItem.description || !this.newItem.price || !this.newItem.unit) {
      return;
    }
    this.isSavingItem = true;
    this.leads.saveItem(this.newItem).subscribe({
      next: (res: any) => {
        this.isSavingItem = false;
        this.isNewItemModalOpen = false;
        // Reload items list and automatically select the newly created item
        this.leads.getItems().subscribe((itemsRes: any) => {
          this.availableItems = itemsRes.map((item: any) => ({ ...item, selected: false, quantity: 1 }));
          const created = itemsRes.find((it: any) => it.description === this.newItem.description && it.price === this.newItem.price) || itemsRes[itemsRes.length - 1];
          if (created && !this.isItemSelected(created)) {
            this.toggleItem(created);
          }
        });
        this.toastCtrl.create({
          message: 'Item created and added successfully!',
          duration: 2000,
          color: 'success'
        }).then(t => t.present());
      },
      error: (err: any) => {
        console.error('Error saving item:', err);
        this.isSavingItem = false;
        this.toastCtrl.create({
          message: 'Failed to create item. Please try again.',
          duration: 2500,
          color: 'danger'
        }).then(t => t.present());
      }
    });
  }

  openItemSelectionModal() {
    this.availableItems.forEach(item => {
      item.selected = this.isItemSelected(item);
    });
    this.isItemModalOpen = true;
  }

  addSelectedItems() {
    this.availableItems.forEach(item => {
      const isAlreadyIn = this.isItemSelected(item);
      if (item.selected && !isAlreadyIn) {
        this.selectedItems.push({ ...item, quantity: 1 });
      } else if (!item.selected && isAlreadyIn) {
        const idx = this.selectedItems.findIndex(si => 
          (item.id && si.id === item.id) || 
          (si.description === item.description && si.price === item.price)
        );
        if (idx > -1) {
          this.selectedItems.splice(idx, 1);
        }
      }
    });
    this.isItemModalOpen = false;
  }

  isItemSelected(item: any): boolean {
    return this.selectedItems.some(si => 
      (item.id && si.id === item.id) || 
      (si.description === item.description && si.price === item.price)
    );
  }

  toggleItem(item: any) {
    const index = this.selectedItems.findIndex(si => 
      (item.id && si.id === item.id) || 
      (si.description === item.description && si.price === item.price)
    );
    if (index > -1) {
      this.selectedItems.splice(index, 1);
    } else {
      this.selectedItems.push({
        ...item,
        quantity: 1
      });
    }
  }

  get filteredAvailableItems(): any[] {
    if (!this.itemSearchQuery || !this.itemSearchQuery.trim()) {
      return this.availableItems;
    }
    const q = this.itemSearchQuery.toLowerCase().trim();
    return this.availableItems.filter(item =>
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.unit && item.unit.toLowerCase().includes(q)) ||
      (item.price && item.price.toString().includes(q))
    );
  }

  removeItem(index: number) {
    this.selectedItems.splice(index, 1);
  }

  get subTotal() { return this.selectedItems.reduce((acc, item) => acc + (item.price * (item.quantity || 0)), 0); }
  get discountAmount() { return this.subTotal * (this.discountPercentage / 100); }
  get gstAmount() {
    return this.selectedItems.reduce((acc, item) => {
      const gst = item.gst !== undefined ? item.gst : this.gstPercentage;
      const amount = item.price * (item.quantity || 0);
      const discountedAmount = amount * (1 - this.discountPercentage / 100);
      return acc + (discountedAmount * gst / 100);
    }, 0);
  }
  get grandTotal() {
    return (this.subTotal - this.discountAmount) + this.gstAmount;
  }

  async loadLogoDataUrl(): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
            return;
          }
        } catch (e) {
          console.error('Logo canvas error', e);
        }
        resolve('assets/Brahmadev Constructions.png');
      };
      img.onerror = () => resolve('assets/Brahmadev Constructions.png');
      img.src = 'assets/Brahmadev Constructions.png';
    });
  }

  async buildQuotationPDF(): Promise<{ doc: jsPDF; fileName: string; quoteId: string }> {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);
    const rightEdge = pageWidth - margin;

    const now = new Date();
    const month = now.toLocaleString('en-IN', { month: 'short' }).toUpperCase();
    const dateStr = now.getDate().toString().padStart(2, '0');
    const year = now.getFullYear().toString().slice(-2);
    const unixSuffix = Date.now().toString().slice(-4);
    const quoteId = `Q${month}${dateStr}${year}${unixSuffix}`;
    const formattedDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    // BRAND COLORS
    const brandNavy: [number, number, number] = [20, 33, 61];     // #14213d Deep Navy
    const brandGold: [number, number, number] = [184, 146, 74];   // #b8924a Elegant Gold
    const brandSand: [number, number, number] = [250, 248, 242];  // #faf8f2 Warm Sand
    const textMain: [number, number, number] = [30, 30, 30];
    const textMuted: [number, number, number] = [100, 100, 100];

    // 1. TOP BRAND BAR
    doc.setFillColor(brandNavy[0], brandNavy[1], brandNavy[2]);
    doc.rect(0, 0, pageWidth, 3.5, 'F');
    doc.setFillColor(brandGold[0], brandGold[1], brandGold[2]);
    doc.rect(0, 3.5, pageWidth, 1, 'F');

    // 2. HEADER: LOGO & DETAILS
    const logoBase64 = await this.loadLogoDataUrl();
    const logoSize = 25;
    try {
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', margin, 10, logoSize, logoSize);
      }
    } catch (e) {
      console.warn('Logo load error', e);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(brandGold[0], brandGold[1], brandGold[2]);
    doc.text('QUOTATION', rightEdge, 13, { align: 'right' });

    doc.setFontSize(16);
    doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
    doc.text('BRAHMADEV CONSTRUCTIONS', rightEdge, 20, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    doc.text('Opp. Durgalakshmi Multiplex, Miraj Road, Athani, Karnataka - 591304', rightEdge, 25, { align: 'right' });
    doc.text('Ph: +91 88849 50068  |  Email: brahmadevaconstructions@gmail.com', rightEdge, 29.5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
    doc.text('GSTIN: 29FHSPB9789R1ZO   |   PAN: FHSPB9789R', rightEdge, 34, { align: 'right' });

    // DIVIDER
    doc.setDrawColor(brandGold[0], brandGold[1], brandGold[2]);
    doc.setLineWidth(0.8);
    doc.line(margin, 38, rightEdge, 38);

    // 3. CLIENT & QUOTE INFO BOX
    const custBoxY = 42;
    const hasCustGst = !!(this.customerGst && this.customerGst.trim());
    const hasCustEmail = !!(this.email && this.email.trim());
    let extraLines = 0;
    if (hasCustGst) extraLines++;
    if (hasCustEmail) extraLines++;
    const custBoxHeight = 29 + (extraLines * 5.5);

    doc.setFillColor(brandSand[0], brandSand[1], brandSand[2]);
    doc.roundedRect(margin, custBoxY, contentWidth, custBoxHeight, 2, 2, 'F');
    doc.setDrawColor(brandGold[0], brandGold[1], brandGold[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, custBoxY, contentWidth, custBoxHeight, 2, 2, 'S');

    // Left Column: Quotation For
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(brandGold[0], brandGold[1], brandGold[2]);
    doc.text('QUOTATION FOR:', margin + 5, custBoxY + 6);

    doc.setFontSize(10);
    doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
    doc.text(this.customerName.toUpperCase() || 'VALUED CUSTOMER', margin + 5, custBoxY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(textMain[0], textMain[1], textMain[2]);
    doc.text(`Site: ${this.siteAddress || 'N/A'}`, margin + 5, custBoxY + 17.5);
    doc.text(`Contact: ${this.contact || 'N/A'}`, margin + 5, custBoxY + 23);
    let leftY = custBoxY + 28.5;
    if (hasCustEmail) {
      doc.text(`Email: ${this.email}`, margin + 5, leftY);
      leftY += 5.5;
    }
    if (hasCustGst) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.text(`GSTIN: ${this.customerGst.toUpperCase()}`, margin + 5, leftY);
    }

    // Right Column: Quote Details
    const midX = margin + (contentWidth / 2) + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(brandGold[0], brandGold[1], brandGold[2]);
    doc.text('QUOTATION DETAILS:', midX, custBoxY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(textMain[0], textMain[1], textMain[2]);
    doc.text('Quote ID: ', midX, custBoxY + 12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
    doc.text(quoteId, midX + 18, custBoxY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMain[0], textMain[1], textMain[2]);
    doc.text(`Quote Date: ${formattedDate}`, midX, custBoxY + 17.5);
    doc.text('Validity: 15 Days from date', midX, custBoxY + 23);
    if (hasCustGst) {
      doc.text('Place of Supply: Karnataka (29)', midX, custBoxY + 28.5);
    }

    // 4. GST BREAKDOWN CALCULATION
    const gstBreakdown: { [key: number]: number } = {};
    this.selectedItems.forEach(item => {
      const gst = item.gst !== undefined ? item.gst : this.gstPercentage;
      const amount = Number(item.price) * Number(item.quantity);
      const discountedAmount = amount * (1 - this.discountPercentage / 100);
      const tax = discountedAmount * gst / 100;
      gstBreakdown[gst] = (gstBreakdown[gst] || 0) + tax;
    });

    const breakdownText = Object.keys(gstBreakdown).map(rateStr => {
      const rate = parseFloat(rateStr);
      const tax = gstBreakdown[rate];
      const halfRate = rate / 2;
      const halfTax = tax / 2;
      return `CGST (${halfRate}%): Rs. ${halfTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}   SGST (${halfRate}%): Rs. ${halfTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    }).join('\n');

    // 5. ITEMS TABLE
    const tableBody: any[][] = this.selectedItems.map((item, idx) => {
      const gst = item.gst !== undefined ? item.gst : this.gstPercentage;
      const amount = Number(item.price) * Number(item.quantity);
      const discountedAmount = amount * (1 - this.discountPercentage / 100);
      const discountedRate = Number(item.price) * (1 - this.discountPercentage / 100);
      const gstVal = discountedAmount * gst / 100;
      return [
        { content: `${idx + 1}. ${item.description}`, styles: { fontStyle: 'bold' } },
        `${item.quantity} ${item.unit || ''}`,
        `Rs. ${discountedRate.toLocaleString('en-IN')}`,
        `Rs. ${gstVal.toLocaleString('en-IN')} (${gst}%)`,
        `Rs. ${discountedAmount.toLocaleString('en-IN')}`
      ];
    });

    tableBody.push([
      { content: 'Sub Total', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', textColor: brandNavy } },
      { content: `Rs. ${this.subTotal.toLocaleString('en-IN')}`, styles: { fontStyle: 'bold' } }
    ]);

    if (this.discountPercentage > 0) {
      tableBody.push([
        { content: `Discount (${this.discountPercentage}%)`, colSpan: 4, styles: { halign: 'right', textColor: textMuted } },
        { content: `- Rs. ${this.discountAmount.toLocaleString('en-IN')}`, styles: { textColor: [180, 50, 50] } }
      ]);
    }

    tableBody.push([
      { content: `Total GST (${this.gstPercentage}% applicable)`, colSpan: 4, styles: { halign: 'right', textColor: textMuted } },
      { content: `Rs. ${this.gstAmount.toLocaleString('en-IN')}`, styles: { fontStyle: 'bold' } }
    ]);

    if (breakdownText) {
      tableBody.push([
        { content: breakdownText, colSpan: 5, styles: { halign: 'right', textColor: textMuted, fontSize: 8 } }
      ]);
    }

    tableBody.push([
      { content: 'GRAND TOTAL', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', fontSize: 10, textColor: brandNavy } },
      { content: `Rs. ${this.grandTotal.toLocaleString('en-IN')}`, styles: { fontStyle: 'bold', fontSize: 10, fillColor: [240, 235, 225], textColor: brandNavy } }
    ]);

    const tableStartY = custBoxY + custBoxHeight + 5;
    autoTable(doc, {
      startY: tableStartY,
      margin: { left: margin, right: margin, bottom: 25 },
      head: [['Work Description', 'Qty', 'Rate', 'GST', 'Total']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: brandNavy, textColor: 255, fontStyle: 'bold', halign: 'left', fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right', fontStyle: 'bold' }
      },
      styles: { fontSize: 8.5, cellPadding: 3.5, lineColor: [220, 220, 220], lineWidth: 0.2 },
      alternateRowStyles: { fillColor: [253, 252, 250] }
    });

    // 6. PAYMENT & SIGNATURE BOX
    let finalY = (doc as any).lastAutoTable.finalY + 8;
    const boxHeight = 36;
    if (finalY + boxHeight + 40 > pageHeight - 20) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFillColor(brandSand[0], brandSand[1], brandSand[2]);
    doc.roundedRect(margin, finalY, contentWidth, boxHeight, 2, 2, 'F');
    doc.setDrawColor(brandGold[0], brandGold[1], brandGold[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, finalY, contentWidth, boxHeight, 2, 2, 'S');

    // Column 1: Bank Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(brandGold[0], brandGold[1], brandGold[2]);
    doc.text('BANK DETAILS:', margin + 4, finalY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(textMain[0], textMain[1], textMain[2]);
    doc.text([
      'Bank: FEDERAL BANK',
      'A/c Name: BRAHMADEV CONSTRUCTIONS',
      'A/c No: 15070200006571',
      'IFSC: FDRL0001507',
      'Branch: Athani'
    ], margin + 4, finalY + 12);

    // Column 2: Terms & Conditions
    const col2X = margin + 68;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(brandGold[0], brandGold[1], brandGold[2]);
    doc.text('QUOTATION TERMS:', col2X, finalY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textMain[0], textMain[1], textMain[2]);
    doc.text([
      '1. Valid for 15 days from date.',
      '2. 50% Advance with order confirmation.',
      '3. Work commences within 7 days of advance.',
      '4. Site water & electricity provided by client.'
    ], col2X, finalY + 12);

    // Column 3: UPI QR Code
    const upiId = 'brahmadev6571@fbl';
    const payeeName = 'Brahmadev Constructions';
    const amount = this.grandTotal.toFixed(2);
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&tn=${encodeURIComponent(quoteId)}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiUrl)}`;
    const qrSize = 22;
    const qrX = rightEdge - qrSize - 6;

    try {
      doc.addImage(qrUrl, 'PNG', qrX, finalY + 4, qrSize, qrSize);
      doc.link(qrX, finalY + 4, qrSize, qrSize, { url: upiUrl });
      doc.setFontSize(7);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      const qrCenterX = qrX + (qrSize / 2);
      doc.text('Scan to Pay via UPI', qrCenterX, finalY + 29, { align: 'center' });
      doc.setFontSize(6.5);
      doc.text(upiId, qrCenterX, finalY + 33, { align: 'center' });
    } catch (e) {
      console.warn('QR Code error', e);
    }

    // Signatory
    const sigY = finalY + boxHeight + 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
    doc.text('FOR BRAHMADEV CONSTRUCTIONS', rightEdge, sigY, { align: 'right' });

    doc.setDrawColor(brandGold[0], brandGold[1], brandGold[2]);
    doc.setLineWidth(0.5);
    doc.line(rightEdge - 50, sigY + 14, rightEdge, sigY + 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Authorized Signatory', rightEdge, sigY + 19, { align: 'right' });

    // 7. FOOTER ON EVERY PAGE
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      if (i > 1) {
        doc.setFillColor(brandNavy[0], brandNavy[1], brandNavy[2]);
        doc.rect(0, 0, pageWidth, 2.5, 'F');
      }
      doc.setDrawColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.setLineWidth(0.4);
      doc.line(margin, 285, rightEdge, 285);
      doc.setFontSize(7);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(
        'Notice: Payments are only valid via the bank/UPI details listed on this quote. Other payment methods are not authorized or recognized.',
        pageWidth / 2,
        289,
        { align: 'center' }
      );
    }

    const cleanCustomer = (this.customerName || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Quote_${quoteId}_${cleanCustomer}.pdf`;
    return { doc, fileName, quoteId };
  }

  saveQuoteToBackend(doc: jsPDF, quoteId: string): void {
    try {
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const quoteData = {
        quoteId,
        customerName: this.customerName,
        siteAddress: this.siteAddress,
        contact: this.contact,
        email: this.email,
        date: new Date().toISOString(),
        grandTotal: this.grandTotal,
        base64: pdfBase64
      };

      this.leads.createQuote(quoteData).subscribe({
        next: (res: any) => {
          console.log('Quotation saved to backend successfully', res);
        },
        error: (err: any) => {
          console.warn('Backend save quote error (non-fatal):', err);
        }
      });
    } catch (e) {
      console.warn('Error packaging quote bundle:', e);
    }
  }

  async previewPDF() {
    this.isGeneratingPdf = true;
    try {
      const { doc, fileName, quoteId } = await this.buildQuotationPDF();
      this.currentGeneratedDoc = doc;
      this.currentFileName = fileName;
      this.currentQuoteId = quoteId;
      this.previewTitle = `Quotation Preview — ${this.customerName || 'Customer'}`;

      if (this.pdfBlobUrl) {
        URL.revokeObjectURL(this.pdfBlobUrl);
      }
      const blob = doc.output('blob');
      this.pdfBlobUrl = URL.createObjectURL(blob);
      this.pdfPreviewSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfBlobUrl);

      this.isPreviewModalOpen = true;
      this.isGeneratingPdf = false;
    } catch (err) {
      console.error('Quotation preview error', err);
      this.isGeneratingPdf = false;
      const toast = await this.toastCtrl.create({
        message: 'Failed to generate quotation preview.',
        duration: 2500,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
  }

  closePreviewModal() {
    this.isPreviewModalOpen = false;
    if (this.pdfBlobUrl) {
      URL.revokeObjectURL(this.pdfBlobUrl);
      this.pdfBlobUrl = null;
    }
    this.pdfPreviewSafeUrl = null;
  }

  async downloadCurrentPDF() {
    this.isGeneratingPdf = true;
    try {
      let doc = this.currentGeneratedDoc;
      let fileName = this.currentFileName;
      let quoteId = this.currentQuoteId;

      if (!doc) {
        const res = await this.buildQuotationPDF();
        doc = res.doc;
        fileName = res.fileName;
        quoteId = res.quoteId;
        this.currentGeneratedDoc = doc;
        this.currentFileName = fileName;
        this.currentQuoteId = quoteId;
      }

      // Save to backend ONLY on user clicking download PDF in preview
      this.saveQuoteToBackend(doc, quoteId);

      if (Capacitor.isNativePlatform()) {
        const pdfBase64 = doc.output('datauristring').split(',')[1];
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Cache
        });
        await Share.share({
          title: fileName,
          url: savedFile.uri,
          dialogTitle: 'Share Quotation PDF'
        });
      } else {
        doc.save(fileName);
      }

      this.isGeneratingPdf = false;
      const toast = await this.toastCtrl.create({
        message: 'Quotation PDF downloaded successfully!',
        duration: 2500,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();
    } catch (err) {
      console.error('Download quote error', err);
      this.isGeneratingPdf = false;
      const toast = await this.toastCtrl.create({
        message: 'Failed to download or share Quotation.',
        duration: 2500,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
  }

  async generatePDF() {
    await this.previewPDF();
  }

  async downloadOrShareDirectly() {
    await this.downloadCurrentPDF();
  }

  back() { this.navCtrl.back(); }
  addLead() { this.navCtrl.navigateForward('/layout/items'); }

  viewQuotations() { this.navCtrl.navigateForward('/layout/quotations-list'); }
}