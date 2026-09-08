import { Component, OnInit, ElementRef, ViewChild, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSpinner,
  IonModal
} from '@ionic/angular/standalone';
import { NavController, ToastController, Platform } from '@ionic/angular';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import {
  arrowBackOutline,
  refreshOutline,
  cashOutline,
  trendingUpOutline,
  peopleOutline,
  eyeOutline,
  fingerPrintOutline,
  calendarOutline,
  analyticsOutline,
  logoFacebook,
  checkmarkCircleOutline,
  alertCircleOutline,
  informationCircleOutline,
  optionsOutline,
  funnelOutline,
  logoGoogle,
  downloadOutline,
  closeOutline,
  documentTextOutline,
  arrowForwardOutline,
  walletOutline,
  openOutline,
  shareSocialOutline,
  checkmarkOutline,
  closeCircleOutline
} from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { Leads } from 'src/app/services/leads';

declare var google: any;
declare var pdfjsLib: any;

@Component({
  selector: 'app-stats',
  templateUrl: './stats.page.html',
  styleUrls: ['./stats.page.scss'],
  standalone: true,
  imports: [
    IonSpinner,
    IonCardTitle,
    IonCardHeader,
    IonCardContent,
    IonCard,
    IonIcon,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonModal,
    CommonModule,
    FormsModule
  ]
})
export class StatsPage implements OnInit {

  // Lead Analytics Charts
  @ViewChild('monthlyChart', { static: false }) monthlyChartRef!: ElementRef;
  @ViewChild('platformChart', { static: false }) platformChartRef!: ElementRef;
  @ViewChild('responseChart', { static: false }) responseChartRef!: ElementRef;
  @ViewChild('monthlyStatusChart', { static: false }) monthlyStatusChartRef!: ElementRef;

  // Meta Ads Chart
  @ViewChild('adDailyChart', { static: false }) adDailyChartRef!: ElementRef;

  // Chart instances for image extraction in PDF export
  monthlyChartInstance: any = null;
  platformChartInstance: any = null;
  responseChartInstance: any = null;
  monthlyStatusChartInstance: any = null;
  adDailyChartInstance: any = null;

  // Active Tab
  selectedTab: 'analytics' | 'meta_ads' | 'google_ads' = 'analytics';

  // Lead Analytics State
  leads: any[] = [];
  isLoading = true;
  monthlyData: { key: string; label: string; count: number }[] = [];
  platformData: { name: string; count: number }[] = [];
  responseData: { name: string; count: number }[] = [];
  totalLeads = 0;

  // Meta Ads State
  isAdsLoading = false;
  metaAdSpendData: any = null;
  adAccountStatus: any = null;
  selectedDatePreset = 'this_month';
  adDatePresets = [
    { id: 'today', label: 'Today' },
    { id: 'last_7d', label: 'Last 7 Days' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'maximum', label: 'All Time' }
  ];

  // Custom Date Range for Meta Ads
  isCustomDateModalOpen = false;
  customStartDate = '';
  customEndDate = '';
  tempCustomStartDate = '';
  tempCustomEndDate = '';
  todayDateStr = new Date().toISOString().slice(0, 10);

  get isCustomDateActive(): boolean {
    return this.selectedDatePreset === 'custom' && Boolean(this.customStartDate && this.customEndDate);
  }

  get customDateRangeLabel(): string {
    if (!this.customStartDate || !this.customEndDate) return 'Custom Range';
    try {
      const d1 = new Date(this.customStartDate);
      const d2 = new Date(this.customEndDate);
      const s1 = d1.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      const s2 = d2.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      return `${s1} - ${s2}`;
    } catch {
      return `${this.customStartDate} to ${this.customEndDate}`;
    }
  }

  // PDF Preview & Export State
  isPreviewModalOpen = false;
  pdfPreviewSafeUrl: SafeResourceUrl | null = null;
  pdfBlobUrl: string | null = null;
  currentGeneratedDoc: jsPDF | null = null;
  previewTitle = '';
  currentFileName = '';
  isGeneratingPdf = false;
  // In-UI PDF page rendering for mobile & desktop
  pdfPages: string[] = [];
  isRenderingPdfPages = false;
  isMobile = false;

  get isNativeApp(): boolean {
    return Capacitor.isNativePlatform();
  }

  get isMobilePlatform(): boolean {
    return this.isMobile || (typeof window !== 'undefined' && window.innerWidth < 768);
  }

  // Google Charts Loading Guard
  private googleChartsLoaded = false;
  private googleChartsLoadingPromise: Promise<void> | null = null;

  constructor(
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private sanitizer: DomSanitizer,
    private service: Leads,
    private platform: Platform,
    private cdr: ChangeDetectorRef
  ) {
    this.isMobile = this.platform.is('android') || this.platform.is('ios') || this.platform.is('mobile') || Capacitor.isNativePlatform();

    addIcons({
      arrowBackOutline,
      refreshOutline,
      analyticsOutline,
      logoGoogle,
      funnelOutline,
      informationCircleOutline,
      cashOutline,
      peopleOutline,
      trendingUpOutline,
      eyeOutline,
      fingerPrintOutline,
      optionsOutline,
      calendarOutline,
      logoFacebook,
      checkmarkCircleOutline,
      alertCircleOutline,
      downloadOutline,
      closeOutline,
      documentTextOutline,
      arrowForwardOutline,
      walletOutline,
      openOutline,
      shareSocialOutline,
      checkmarkOutline,
      closeCircleOutline
    });
  }

  ngOnInit() {
    this.checkAndShowBetaToast();
    this.ensureGoogleChartsLoaded().catch(e => console.warn('Google charts pre-load notice:', e));
    this.loadData();
    this.loadAdAccountStatus();
  }

  ionViewDidEnter() {
    if (this.selectedTab === 'analytics') {
      if (this.leads.length > 0 && !this.isLoading) {
        setTimeout(() => this.drawCharts(0), 50);
      } else if (!this.isLoading) {
        this.loadData();
      }
    } else if (this.selectedTab === 'meta_ads') {
      if (this.metaAdSpendData && !this.isAdsLoading) {
        setTimeout(() => this.drawAdSpendChart(0), 50);
      }
    }
  }

  private ensureGoogleChartsLoaded(): Promise<void> {
    if (this.googleChartsLoaded && typeof google !== 'undefined' && google.visualization) {
      return Promise.resolve();
    }
    if (this.googleChartsLoadingPromise) {
      return this.googleChartsLoadingPromise;
    }

    this.googleChartsLoadingPromise = new Promise<void>((resolve, reject) => {
      const loadPackages = () => {
        try {
          google.charts.load('current', { packages: ['corechart'] });
          google.charts.setOnLoadCallback(() => {
            this.googleChartsLoaded = true;
            resolve();
          });
        } catch (err) {
          if (typeof google !== 'undefined' && google.visualization) {
            this.googleChartsLoaded = true;
            resolve();
          } else {
            reject(err);
          }
        }
      };

      if (typeof google !== 'undefined' && google.charts) {
        loadPackages();
      } else {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (typeof google !== 'undefined' && google.charts) {
            clearInterval(interval);
            loadPackages();
          } else if (attempts > 50) {
            clearInterval(interval);
            reject(new Error('Timed out waiting for Google Charts library'));
          }
        }, 100);
      }
    });

    return this.googleChartsLoadingPromise;
  }

  async checkAndShowBetaToast() {
    const isMobile = this.platform.is('mobile') || 
                     this.platform.is('android') || 
                     this.platform.is('ios') || 
                     Capacitor.isNativePlatform() || 
                     (typeof window !== 'undefined' && window.innerWidth < 768);
    if (isMobile) {
      const toast = await this.toastCtrl.create({
        message: 'This feature is in beta on mobile. For the best view, switch to web.',
        duration: 3500,
        position: 'bottom',
        color: 'dark',
        buttons: [
          {
            text: 'OK',
            role: 'cancel'
          }
        ]
      });
      await toast.present();
    }
  }

  @HostListener('window:resize')
  onResize() {
    if (typeof google !== 'undefined' && google.visualization) {
      if (this.selectedTab === 'analytics' && !this.isLoading) {
        this.drawCharts(0);
      } else if (this.selectedTab === 'meta_ads' && !this.isAdsLoading && this.metaAdSpendData) {
        this.drawAdSpendChart(0);
      }
    }
  }

  back() {
    this.navCtrl.back();
  }

  goToLeads() {
    this.navCtrl.navigateForward('/layout/leads');
  }

  switchTab(tab: 'analytics' | 'meta_ads' | 'google_ads') {
    this.selectedTab = tab;
    this.cdr.detectChanges();
    if (tab === 'meta_ads') {
      if (!this.metaAdSpendData) {
        this.loadMetaAdSpend();
      } else {
        setTimeout(() => this.drawAdSpendChart(0), 100);
      }
    } else if (tab === 'analytics') {
      if (this.leads.length === 0) {
        this.loadData();
      } else {
        setTimeout(() => this.drawCharts(0), 100);
      }
    }
  }

  refreshCurrentTab() {
    if (this.selectedTab === 'analytics') {
      this.loadData();
    } else if (this.selectedTab === 'meta_ads') {
      this.loadMetaAdSpend();
      this.loadAdAccountStatus();
    }
  }

  /* ---------------------------------------------------- */
  /*               LEAD ANALYTICS METHODS                 */
  /* ---------------------------------------------------- */

  loadData() {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.service.getLeads().subscribe({
      next: async (res: any) => {
        this.leads = res || [];
        this.totalLeads = this.leads.length;
        this.processMonthlyData();
        this.processPlatformData();
        this.processResponseData();
        this.isLoading = false;
        this.cdr.detectChanges(); // Immediately render chart containers in DOM

        try {
          await this.ensureGoogleChartsLoaded();
        } catch (e) {
          console.error('Error ensuring Google Charts loaded:', e);
        }

        setTimeout(() => {
          this.drawCharts(0);
        }, 50);
      },
      error: (err) => {
        console.error('Failed to load leads:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  drawCharts(retryCount = 0) {
    if (this.selectedTab !== 'analytics' || this.isLoading) return;

    if (!this.monthlyChartRef?.nativeElement || typeof google === 'undefined' || !google.visualization) {
      if (retryCount < 6) {
        setTimeout(() => this.drawCharts(retryCount + 1), 100);
      }
      return;
    }

    try {
      this.drawMonthlyChart();
      this.drawPlatformChart();
      this.drawResponseChart();
      this.drawMonthlyStatusChart();
    } catch (e) {
      console.warn('Error while drawing charts, retrying...', e);
      if (retryCount < 4) {
        setTimeout(() => this.drawCharts(retryCount + 1), 150);
      }
    }
  }

  processMonthlyData() {
    const monthMap = new Map<string, { label: string; count: number }>();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    this.leads.forEach((lead: any) => {
      const dateStr = lead.time || lead.createdAt;
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;

      const year = d.getFullYear();
      const month = d.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      const label = `${monthNames[month]} ${year}`;

      if (!monthMap.has(key)) {
        monthMap.set(key, { label, count: 1 });
      } else {
        const item = monthMap.get(key)!;
        item.count++;
      }
    });

    this.monthlyData = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({ key, label: value.label, count: value.count }));
  }

  processPlatformData() {
    const platformMap = new Map<string, number>();
    this.leads.forEach((lead: any) => {
      const platform = this.getPlatformLabel(lead.platform);
      platformMap.set(platform, (platformMap.get(platform) || 0) + 1);
    });
    this.platformData = Array.from(platformMap, ([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  processResponseData() {
    const responseMap = new Map<string, number>();
    this.leads.forEach((lead: any) => {
      const response = lead.response || 'Unknown';
      responseMap.set(response, (responseMap.get(response) || 0) + 1);
    });
    this.responseData = Array.from(responseMap, ([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  getPlatformLabel(platform: string): string {
    switch (platform?.toLowerCase()) {
      case 'fb': return 'Facebook';
      case 'ig': return 'Instagram';
      case 'direct contact': return 'Direct Contact';
      case 'call': return 'Call';
      default: return platform || 'Other';
    }
  }

  drawMonthlyChart() {
    if (!this.monthlyChartRef?.nativeElement || typeof google === 'undefined' || !google.visualization) return;

    const dataArray: any[] = [['Month', 'Leads', { role: 'style' }, { role: 'annotation' }]];
    const colors = ['#3880ff', '#3dc2ff', '#5260ff', '#2dd36f', '#ffc409', '#eb445a', '#222428', '#7044ff'];

    this.monthlyData.forEach((item, index) => {
      const color = colors[index % colors.length];
      dataArray.push([item.label, item.count, color, item.count.toString()]);
    });

    const data = google.visualization.arrayToDataTable(dataArray);
    const options = {
      title: '',
      legend: { position: 'none' },
      chartArea: { width: '88%', height: '65%', top: 30 },
      hAxis: {
        slantedText: true,
        slantedTextAngle: 30,
        textStyle: { fontSize: 11, color: '#555' }
      },
      vAxis: {
        title: 'Leads Count',
        minValue: 0,
        format: '0',
        gridlines: { color: '#f0f0f0' },
        textStyle: { fontSize: 11, color: '#555' },
        titleTextStyle: { fontSize: 12, italic: false, color: '#666' }
      },
      annotations: {
        alwaysOutside: true,
        textStyle: { fontSize: 11, color: '#333', bold: true }
      },
      bar: { groupWidth: '55%' },
      backgroundColor: 'transparent',
      fontName: 'inherit'
    };

    this.monthlyChartInstance = new google.visualization.ColumnChart(this.monthlyChartRef.nativeElement);
    this.monthlyChartInstance.draw(data, options);
  }

  drawPlatformChart() {
    if (!this.platformChartRef?.nativeElement || typeof google === 'undefined' || !google.visualization) return;

    const dataArray: any[] = [['Platform', 'Leads']];
    this.platformData.forEach(item => dataArray.push([item.name, item.count]));

    const data = google.visualization.arrayToDataTable(dataArray);
    const options = {
      title: '',
      pieHole: 0.4,
      colors: ['#1877F2', '#E1306C', '#34A853', '#FF9800', '#9C27B0', '#607D8B'],
      legend: { position: 'bottom', textStyle: { fontSize: 13 } },
      chartArea: { width: '90%', height: '75%' },
      pieSliceTextStyle: { fontSize: 12 },
      backgroundColor: 'transparent',
      fontName: 'inherit'
    };

    this.platformChartInstance = new google.visualization.PieChart(this.platformChartRef.nativeElement);
    this.platformChartInstance.draw(data, options);
  }

  drawResponseChart() {
    if (!this.responseChartRef?.nativeElement || typeof google === 'undefined' || !google.visualization) return;

    const dataArray: any[] = [['Response Status', 'Leads']];
    this.responseData.forEach(item => dataArray.push([item.name, item.count]));

    const data = google.visualization.arrayToDataTable(dataArray);
    const options = {
      title: '',
      curveType: 'function',
      legend: { position: 'none' },
      colors: ['#3880ff'],
      pointSize: 7,
      pointShape: 'circle',
      lineWidth: 3,
      chartArea: { width: '82%', height: '65%', top: 20 },
      hAxis: {
        slantedText: true,
        slantedTextAngle: 35,
        textStyle: { fontSize: 11, color: '#555' }
      },
      vAxis: {
        title: 'Leads Count',
        minValue: 0,
        format: '0',
        gridlines: { color: '#f0f0f0' },
        textStyle: { fontSize: 11, color: '#555' },
        titleTextStyle: { fontSize: 12, italic: false, color: '#666' }
      },
      backgroundColor: 'transparent',
      fontName: 'inherit'
    };

    this.responseChartInstance = new google.visualization.LineChart(this.responseChartRef.nativeElement);
    this.responseChartInstance.draw(data, options);
  }

  getPipelineGroup(response: string): string {
    const r = (response || '').trim().toLowerCase();
    if (['interested', 'visiting soon', 'visit confirmed', 'conversion started', 'order completed'].includes(r)) {
      return 'Active / Hot';
    }
    if (['new', 'call back requested', 'yet to think', 'busy'].includes(r)) {
      return 'Follow-up';
    }
    if (['closed', 'not interested', 'wrong number'].includes(r)) {
      return 'Closed / Lost';
    }
    if (['engineer', 'contractor', 'mestri'].includes(r)) {
      return 'Professionals';
    }
    return 'Other';
  }

  drawMonthlyStatusChart() {
    if (!this.monthlyStatusChartRef?.nativeElement || typeof google === 'undefined' || !google.visualization) return;

    const pipelineGroups = ['Active / Hot', 'Follow-up', 'Closed / Lost', 'Professionals'];
    const pipelineColors = ['#2dd36f', '#3880ff', '#eb445a', '#7044ff'];

    const headerRow: any[] = ['Month', ...pipelineGroups];
    const dataArray: any[] = [headerRow];

    const monthStatusMap = new Map<string, { label: string; groupCounts: Map<string, number> }>();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    this.leads.forEach((lead: any) => {
      const dateStr = lead.time || lead.createdAt;
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;

      const year = d.getFullYear();
      const month = d.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      const label = `${monthNames[month]} ${year}`;
      const group = this.getPipelineGroup(lead.response);

      if (!monthStatusMap.has(key)) {
        monthStatusMap.set(key, { label, groupCounts: new Map<string, number>() });
      }

      const item = monthStatusMap.get(key)!;
      item.groupCounts.set(group, (item.groupCounts.get(group) || 0) + 1);
    });

    const sortedMonths = Array.from(monthStatusMap.entries()).sort(([a], [b]) => a.localeCompare(b));

    sortedMonths.forEach(([_, value]) => {
      const row: any[] = [value.label];
      pipelineGroups.forEach(group => {
        row.push(value.groupCounts.get(group) || 0);
      });
      dataArray.push(row);
    });

    const data = google.visualization.arrayToDataTable(dataArray);
    const options = {
      title: '',
      isStacked: true,
      legend: {
        position: 'top',
        alignment: 'center',
        textStyle: { fontSize: 12, color: '#333', bold: true }
      },
      colors: pipelineColors,
      chartArea: { width: '88%', height: '65%', top: 40 },
      hAxis: {
        slantedText: true,
        slantedTextAngle: 30,
        textStyle: { fontSize: 11, color: '#555' }
      },
      vAxis: {
        title: 'Leads Count',
        minValue: 0,
        format: '0',
        gridlines: { color: '#f0f0f0' },
        textStyle: { fontSize: 11, color: '#555' },
        titleTextStyle: { fontSize: 12, italic: false, color: '#666' }
      },
      bar: { groupWidth: '50%' },
      backgroundColor: 'transparent',
      fontName: 'inherit'
    };

    this.monthlyStatusChartInstance = new google.visualization.ColumnChart(this.monthlyStatusChartRef.nativeElement);
    this.monthlyStatusChartInstance.draw(data, options);
  }

  /* ---------------------------------------------------- */
  /*                 META ADS SPEND METHODS               */
  /* ---------------------------------------------------- */

  selectDatePreset(presetId: string) {
    if (presetId === 'custom') {
      this.openCustomDateModal();
      return;
    }
    this.selectedDatePreset = presetId;
    this.customStartDate = '';
    this.customEndDate = '';
    this.loadMetaAdSpend();
  }

  openCustomDateModal() {
    this.tempCustomStartDate = this.customStartDate || this.getOneMonthAgoStr();
    this.tempCustomEndDate = this.customEndDate || this.todayDateStr;
    this.isCustomDateModalOpen = true;
  }

  closeCustomDateModal() {
    this.isCustomDateModalOpen = false;
  }

  applyCustomDateFilter() {
    if (!this.tempCustomStartDate || !this.tempCustomEndDate) {
      this.toastCtrl.create({
        message: 'Please select both From and To dates.',
        duration: 2500,
        color: 'warning',
        position: 'bottom'
      }).then(t => t.present());
      return;
    }

    if (this.tempCustomStartDate > this.tempCustomEndDate) {
      this.toastCtrl.create({
        message: 'From Date cannot be after To Date.',
        duration: 2500,
        color: 'warning',
        position: 'bottom'
      }).then(t => t.present());
      return;
    }

    this.customStartDate = this.tempCustomStartDate;
    this.customEndDate = this.tempCustomEndDate;
    this.selectedDatePreset = 'custom';
    this.isCustomDateModalOpen = false;
    this.loadMetaAdSpend();
  }

  clearCustomDateFilter() {
    this.customStartDate = '';
    this.customEndDate = '';
    this.tempCustomStartDate = '';
    this.tempCustomEndDate = '';
    this.selectedDatePreset = 'this_month';
    this.isCustomDateModalOpen = false;
    this.loadMetaAdSpend();
  }

  setQuickDateRange(range: number | string) {
    const today = new Date();
    this.tempCustomEndDate = today.toISOString().slice(0, 10);
    if (typeof range === 'number') {
      const from = new Date();
      from.setDate(today.getDate() - range);
      this.tempCustomStartDate = from.toISOString().slice(0, 10);
    } else if (range === 'this_month_range') {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      this.tempCustomStartDate = from.toISOString().slice(0, 10);
    }
  }

  private getOneMonthAgoStr(): string {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }

  loadAdAccountStatus() {
    this.service.getMetaAdAccountStatus().subscribe({
      next: (res: any) => {
        this.adAccountStatus = res;
        this.cdr.detectChanges();
      },
      error: () => {
        this.adAccountStatus = { connected: false, configured: false };
        this.cdr.detectChanges();
      }
    });
  }

  loadMetaAdSpend() {
    this.isAdsLoading = true;
    this.cdr.detectChanges();

    const fetchObservable = (this.selectedDatePreset === 'custom' && this.customStartDate && this.customEndDate)
      ? this.service.getMetaAdSpend(undefined, this.customStartDate, this.customEndDate)
      : this.service.getMetaAdSpend(this.selectedDatePreset);

    fetchObservable.subscribe({
      next: async (res: any) => {
        this.metaAdSpendData = res;
        this.isAdsLoading = false;
        this.cdr.detectChanges();

        try {
          await this.ensureGoogleChartsLoaded();
        } catch (e) {
          console.error('Error ensuring Google Charts loaded:', e);
        }

        setTimeout(() => this.drawAdSpendChart(0), 50);
      },
      error: (err) => {
        console.error('Error fetching Meta Ad Spend:', err);
        this.isAdsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  drawAdSpendChart(retryCount = 0) {
    if (this.selectedTab !== 'meta_ads' || this.isAdsLoading || !this.metaAdSpendData) return;

    if (!this.adDailyChartRef?.nativeElement || typeof google === 'undefined' || !google.visualization) {
      if (retryCount < 6) {
        setTimeout(() => this.drawAdSpendChart(retryCount + 1), 100);
      }
      return;
    }

    const trends = this.metaAdSpendData.dailyTrends || [];
    if (trends.length === 0) return;

    try {
      const dataArray: any[] = [
        [
          'Date',
          'Daily Spend (₹)',
          { role: 'style' },
          'Leads Acquired'
        ]
      ];

      trends.forEach((item: any) => {
        const d = new Date(item.date);
        const formattedDate = isNaN(d.getTime())
          ? item.date
          : `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;

        dataArray.push([
          formattedDate,
          item.spend || 0,
          '#1877F2',
          item.leads || 0
        ]);
      });

      const data = google.visualization.arrayToDataTable(dataArray);

      const options = {
        title: '',
        legend: { position: 'top', alignment: 'center' },
        seriesType: 'bars',
        series: {
          0: { targetAxisIndex: 0, color: '#1877F2' },
          1: { type: 'line', targetAxisIndex: 1, color: '#10b981', pointSize: 6, lineWidth: 3 }
        },
        vAxes: {
          0: {
            title: 'Spend (₹)',
            textStyle: { color: '#1877F2', fontSize: 11 },
            titleTextStyle: { color: '#1877F2', fontSize: 12, italic: false, bold: true },
            minValue: 0,
            gridlines: { color: '#f1f5f9' }
          },
          1: {
            title: 'Leads Acquired',
            textStyle: { color: '#10b981', fontSize: 11 },
            titleTextStyle: { color: '#10b981', fontSize: 12, italic: false, bold: true },
            minValue: 0,
            gridlines: { count: 0 }
          }
        },
        hAxis: {
          slantedText: true,
          slantedTextAngle: 35,
          textStyle: { fontSize: 10, color: '#64748b' }
        },
        chartArea: { width: '85%', height: '65%', top: 35 },
        bar: { groupWidth: '60%' },
        backgroundColor: 'transparent',
        fontName: 'inherit'
      };

      this.adDailyChartInstance = new google.visualization.ComboChart(this.adDailyChartRef.nativeElement);
      this.adDailyChartInstance.draw(data, options);
    } catch (e) {
      console.warn('Error drawing ad spend chart, retrying...', e);
      if (retryCount < 4) {
        setTimeout(() => this.drawAdSpendChart(retryCount + 1), 150);
      }
    }
  }

  /* ---------------------------------------------------- */
  /*                 PDF EXPORT & PREVIEW                 */
  /* ---------------------------------------------------- */

  loadLogoDataUrl(): Promise<string> {
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
          console.error('Error drawing logo to canvas', e);
        }
        resolve('assets/Brahmadev Constructions.png');
      };
      img.onerror = () => {
        resolve('assets/Brahmadev Constructions.png');
      };
      img.src = 'assets/Brahmadev Constructions.png';
    });
  }

  async exportReportPDF() {
    if (this.isGeneratingPdf) return;

    if (this.selectedTab === 'analytics') {
      if (this.isLoading) {
        const toast = await this.toastCtrl.create({
          message: 'Please wait, lead analytics data is still loading...',
          duration: 2000,
          position: 'bottom',
          color: 'warning'
        });
        await toast.present();
        return;
      }
      if (!this.monthlyChartInstance && this.monthlyChartRef?.nativeElement) {
        this.drawCharts();
        await new Promise(r => setTimeout(r, 200));
      }
      await this.generateLeadAnalyticsPDF();
    } else if (this.selectedTab === 'meta_ads') {
      if (this.isAdsLoading) {
        const toast = await this.toastCtrl.create({
          message: 'Please wait, Meta Ads data is still loading...',
          duration: 2000,
          position: 'bottom',
          color: 'warning'
        });
        await toast.present();
        return;
      }
      if (!this.metaAdSpendData || this.metaAdSpendData.error) {
        const toast = await this.toastCtrl.create({
          message: 'Meta Ads data is not available to export.',
          duration: 2500,
          position: 'bottom',
          color: 'danger'
        });
        await toast.present();
        return;
      }
      if (!this.adDailyChartInstance && this.adDailyChartRef?.nativeElement) {
        this.drawAdSpendChart();
        await new Promise(r => setTimeout(r, 200));
      }
      await this.generateMetaAdsPDF();
    } else {
      const toast = await this.toastCtrl.create({
        message: 'Google Ads report export is coming soon.',
        duration: 2000,
        position: 'bottom',
        color: 'medium'
      });
      await toast.present();
    }
  }

  // --- CHART IMAGE EXTRACTION HELPERS FOR PDF EXPORT ---
  async getChartImage(chartInstance: any, elementRef?: ElementRef): Promise<string | null> {
    try {
      if (chartInstance && typeof chartInstance.getImageURI === 'function') {
        const uri = chartInstance.getImageURI();
        if (uri && typeof uri === 'string' && uri.startsWith('data:image')) {
          return uri;
        }
      }
    } catch (e) {
      console.warn('chartInstance.getImageURI() notice:', e);
    }

    // Fallback: extract SVG directly from DOM element and render to PNG canvas
    try {
      const el = elementRef?.nativeElement;
      const svg = el?.querySelector('svg');
      if (svg) {
        return await this.svgToPngDataUrl(svg);
      }
    } catch (e) {
      console.warn('SVG extraction fallback notice:', e);
    }

    return null;
  }

  private svgToPngDataUrl(svgElement: SVGElement): Promise<string | null> {
    return new Promise((resolve) => {
      try {
        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(svgElement);

        if (!svgString.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
          svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        if (!svgString.match(/^<svg[^>]+xmlns\:xlink="http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
          svgString = svgString.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
        }

        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();

        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const scale = 2; // high resolution for crisp PDF
            const width = (svgElement.clientWidth || 650) * scale;
            const height = (svgElement.clientHeight || 320) * scale;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
              URL.revokeObjectURL(url);
              resolve(canvas.toDataURL('image/png'));
              return;
            }
          } catch (err) {
            console.warn('Canvas draw SVG error:', err);
          }
          URL.revokeObjectURL(url);
          resolve(null);
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(null);
        };

        img.src = url;
      } catch (err) {
        console.warn('svgToPngDataUrl error:', err);
        resolve(null);
      }
    });
  }

  drawChartPdfCard(doc: jsPDF, title: string, imgData: string, x: number, y: number, w: number, h: number) {
    const brandNavy: [number, number, number] = [20, 33, 61];
    const brandGold: [number, number, number] = [184, 146, 74];

    // Card Outer Box (White background, subtle light border)
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220, 226, 235);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, w, h, 2, 2, 'FD');

    // Card Header Bar
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, w, 7, 2, 2, 'F');
    doc.rect(x, y + 4, w, 3, 'F'); // Square bottom corners of header

    // Small Gold Accent dot/bar
    doc.setFillColor(brandGold[0], brandGold[1], brandGold[2]);
    doc.rect(x + 3, y + 2.2, 2, 2.6, 'F');

    // Title Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
    doc.text(title, x + 7, y + 4.8);

    // Separator line
    doc.setDrawColor(230, 235, 242);
    doc.setLineWidth(0.3);
    doc.line(x, y + 7, x + w, y + 7);

    // Render Chart Image
    try {
      doc.addImage(imgData, 'PNG', x + 2, y + 8, w - 4, h - 9.5);
    } catch (e) {
      console.warn('Error embedding chart image into PDF:', e);
    }
  }

  async generateLeadAnalyticsPDF() {
    this.isGeneratingPdf = true;
    try {
      const logoBase64 = await this.loadLogoDataUrl();
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - (margin * 2);
      const rightEdge = pageWidth - margin;

      // Brand Colors (Matching Fixed Cost Estimate & Brahmadev Logo)
      const brandNavy: [number, number, number] = [20, 33, 61];     // #14213d Deep Navy
      const brandGold: [number, number, number] = [184, 146, 74];   // #b8924a Elegant Gold
      const brandSand: [number, number, number] = [250, 248, 242];  // #faf8f2 Warm Sand
      const textMain: [number, number, number] = [30, 30, 30];       // #1e1e1e Dark Text
      const textMuted: [number, number, number] = [100, 100, 100];   // #646464 Muted Text

      // 1. Top Decorative Brand Bar (Navy & Gold)
      doc.setFillColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.rect(0, 0, pageWidth, 3.5, 'F');
      doc.setFillColor(brandGold[0], brandGold[1], brandGold[2]);
      doc.rect(0, 3.5, pageWidth, 1, 'F');

      let currentY = 8;

      // 2. Logo on Left
      const logoSize = 22;
      try {
        if (logoBase64) {
          doc.addImage(logoBase64, 'PNG', margin, currentY, logoSize, logoSize);
        }
      } catch (err) {
        console.warn('Logo load fallback', err);
      }

      // 3. Header Information Block (Clean, No Invoice Content)
      const textStartX = margin + logoSize + 4;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.text('BRAHMADEV CONSTRUCTIONS', textStartX, currentY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);
      doc.text('Opp. Durgalakshmi Multiplex, Miraj Road, Athani, Karnataka - 591304', textStartX, currentY + 11);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2);
      doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.text('Phone: ', textStartX, currentY + 16.5);
      const phW = doc.getTextWidth('Phone: ');

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text('+91 88849 50068', textStartX + phW, currentY + 16.5);

      const emailVal = 'brahmadevaconstructions@gmail.com';
      const emailLabel = 'Email: ';
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const emailValW = doc.getTextWidth(emailVal);
      doc.text(emailVal, rightEdge, currentY + 16.5, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.text(emailLabel, rightEdge - emailValW, currentY + 16.5, { align: 'right' });

      currentY += 21;

      // Divider Line with Gold accent
      doc.setDrawColor(brandGold[0], brandGold[1], brandGold[2]);
      doc.setLineWidth(0.6);
      doc.line(margin, currentY, rightEdge, currentY);

      currentY += 5;

      // 4. Report Header Banner
      const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      doc.setFillColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.roundedRect(margin, currentY, contentWidth, 15, 2, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text('LEAD STATISTICS & PIPELINE REPORT', margin + 6, currentY + 6.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(brandGold[0], brandGold[1], brandGold[2]);
      doc.text(`Generated on: ${todayStr}  •  Lead Analytics Overview`, margin + 6, currentY + 11.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(brandGold[0], brandGold[1], brandGold[2]);
      doc.text(`TOTAL CAPTURED: ${this.totalLeads.toLocaleString('en-IN')} LEADS`, rightEdge - 6, currentY + 9.5, { align: 'right' });

      currentY += 19;

      // 5. Summary KPI Box
      doc.setFillColor(brandSand[0], brandSand[1], brandSand[2]);
      doc.setDrawColor(brandGold[0], brandGold[1], brandGold[2]);
      doc.setLineWidth(0.4);
      doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'FD');

      const colWidth = contentWidth / 3;

      // KPI 1: Total Leads
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.text('TOTAL LEADS CAPTURED', margin + 6, currentY + 7);
      doc.setFontSize(13);
      doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.text(this.totalLeads.toLocaleString('en-IN'), margin + 6, currentY + 16);

      // KPI 2: Top Source
      const topPlatform = this.platformData.length > 0 ? `${this.platformData[0].name} (${this.platformData[0].count})` : 'N/A';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.text('PRIMARY LEAD SOURCE', margin + colWidth + 6, currentY + 7);
      doc.setFontSize(11);
      doc.setTextColor(brandGold[0], brandGold[1], brandGold[2]);
      doc.text(topPlatform, margin + colWidth + 6, currentY + 16);

      // KPI 3: Active/Hot Pipeline
      const activeHotLeads = this.leads.filter(l => this.getPipelineGroup(l.response) === 'Active / Hot').length;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.text('ACTIVE / HOT PIPELINE', margin + (colWidth * 2) + 6, currentY + 7);
      doc.setFontSize(13);
      doc.setTextColor(16, 150, 90);
      doc.text(`${activeHotLeads.toLocaleString('en-IN')} leads`, margin + (colWidth * 2) + 6, currentY + 16);

      currentY += 26;

      // 6. Table 1: Lead Pipeline Stage Breakdown
      const responseTableBody: any[] = this.responseData.map(r => {
        const pct = this.totalLeads > 0 ? ((r.count / this.totalLeads) * 100).toFixed(1) + '%' : '0%';
        const group = this.getPipelineGroup(r.name);
        return [r.name, group, r.count.toLocaleString('en-IN'), pct];
      });

      responseTableBody.push([
        { content: 'Total', styles: { fontStyle: 'bold' } },
        { content: '-', styles: { fontStyle: 'bold' } },
        { content: this.totalLeads.toLocaleString('en-IN'), styles: { fontStyle: 'bold' } },
        { content: '100%', styles: { fontStyle: 'bold' } }
      ]);

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Lead Response / Status', 'Pipeline Group', 'Leads Count', 'Percentage']],
        body: responseTableBody,
        theme: 'grid',
        headStyles: { fillColor: brandNavy, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
        styles: { fontSize: 8, cellPadding: 2.5, textColor: textMain },
        alternateRowStyles: { fillColor: brandSand },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 45 },
          2: { halign: 'right' },
          3: { halign: 'right' }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;

      // 7. Table 2: Platform Distribution
      const platformTableBody: any[] = this.platformData.map(p => {
        const pct = this.totalLeads > 0 ? ((p.count / this.totalLeads) * 100).toFixed(1) + '%' : '0%';
        return [p.name, p.count.toLocaleString('en-IN'), pct];
      });

      platformTableBody.push([
        { content: 'Total', styles: { fontStyle: 'bold' } },
        { content: this.totalLeads.toLocaleString('en-IN'), styles: { fontStyle: 'bold' } },
        { content: '100%', styles: { fontStyle: 'bold' } }
      ]);

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Platform / Lead Source', 'Total Leads', 'Share (%)']],
        body: platformTableBody,
        theme: 'grid',
        headStyles: { fillColor: brandNavy, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
        styles: { fontSize: 8, cellPadding: 2.5, textColor: textMain },
        alternateRowStyles: { fillColor: brandSand },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { halign: 'right' },
          2: { halign: 'right' }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;

      // 8. Table 3: Monthly Breakdown
      if (this.monthlyData.length > 0) {
        if (currentY + 45 > pageHeight - 20) {
          doc.addPage();
          currentY = 16;
        }

        const monthlyTableBody: any[] = this.monthlyData.map(m => {
          const pct = this.totalLeads > 0 ? ((m.count / this.totalLeads) * 100).toFixed(1) + '%' : '0%';
          return [m.label, m.count.toLocaleString('en-IN'), pct];
        });

        autoTable(doc, {
          startY: currentY,
          margin: { left: margin, right: margin },
          head: [['Month', 'Leads Generated', 'Monthly Share (%)']],
          body: monthlyTableBody,
          theme: 'grid',
          headStyles: { fillColor: brandNavy, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
          styles: { fontSize: 8, cellPadding: 2.5, textColor: textMain },
          alternateRowStyles: { fillColor: brandSand },
          columnStyles: {
            0: { cellWidth: 100 },
            1: { halign: 'right' },
            2: { halign: 'right' }
          }
        });
      }

      currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : currentY + 10;

      // 9. Visual Analytics & Charts Section (Appended below existing tables)
      const monthlyImg = await this.getChartImage(this.monthlyChartInstance, this.monthlyChartRef);
      const statusImg = await this.getChartImage(this.monthlyStatusChartInstance, this.monthlyStatusChartRef);
      const platformImg = await this.getChartImage(this.platformChartInstance, this.platformChartRef);
      const responseImg = await this.getChartImage(this.responseChartInstance, this.responseChartRef);

      const hasAnyChart = monthlyImg || statusImg || platformImg || responseImg;
      if (hasAnyChart) {
        if (currentY + 75 > pageHeight - 20) {
          doc.addPage();
          currentY = 16;
        }

        // Section Banner
        doc.setFillColor(brandNavy[0], brandNavy[1], brandNavy[2]);
        doc.roundedRect(margin, currentY, contentWidth, 10, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(255, 255, 255);
        doc.text('VISUAL ANALYTICS & CHARTS', margin + 6, currentY + 6.5);
        doc.setFontSize(7.5);
        doc.setTextColor(brandGold[0], brandGold[1], brandGold[2]);
        doc.text('Performance Trends & Graphical Breakdowns', rightEdge - 6, currentY + 6.5, { align: 'right' });
        currentY += 14;

        // Chart 1: Leads by Month
        if (monthlyImg) {
          const chartBoxHeight = 62;
          if (currentY + chartBoxHeight + 10 > pageHeight - 20) {
            doc.addPage();
            currentY = 16;
          }
          this.drawChartPdfCard(doc, 'Leads by Month (Acquisition Trend)', monthlyImg, margin, currentY, contentWidth, chartBoxHeight);
          currentY += chartBoxHeight + 8;
        }

        // Chart 2: Monthly Leads by Pipeline Stage
        if (statusImg) {
          const chartBoxHeight = 62;
          if (currentY + chartBoxHeight + 10 > pageHeight - 20) {
            doc.addPage();
            currentY = 16;
          }
          this.drawChartPdfCard(doc, 'Monthly Leads by Pipeline Stage', statusImg, margin, currentY, contentWidth, chartBoxHeight);
          currentY += chartBoxHeight + 8;
        }

        // Charts 3 & 4: Platform Share & Response Status
        if (platformImg && responseImg) {
          const chartBoxHeight = 60;
          if (currentY + chartBoxHeight + 10 > pageHeight - 20) {
            doc.addPage();
            currentY = 16;
          }
          const halfWidth = (contentWidth - 4) / 2;
          this.drawChartPdfCard(doc, 'Leads by Platform Source', platformImg, margin, currentY, halfWidth, chartBoxHeight);
          this.drawChartPdfCard(doc, 'Leads by Response Status', responseImg, margin + halfWidth + 4, currentY, halfWidth, chartBoxHeight);
          currentY += chartBoxHeight + 8;
        } else if (platformImg) {
          const chartBoxHeight = 62;
          if (currentY + chartBoxHeight + 10 > pageHeight - 20) {
            doc.addPage();
            currentY = 16;
          }
          this.drawChartPdfCard(doc, 'Leads by Platform Source', platformImg, margin, currentY, contentWidth, chartBoxHeight);
          currentY += chartBoxHeight + 8;
        } else if (responseImg) {
          const chartBoxHeight = 62;
          if (currentY + chartBoxHeight + 10 > pageHeight - 20) {
            doc.addPage();
            currentY = 16;
          }
          this.drawChartPdfCard(doc, 'Leads by Response Status', responseImg, margin, currentY, contentWidth, chartBoxHeight);
          currentY += chartBoxHeight + 8;
        }
      }

      // Add Footers with date and time & brand color line
      this.addPdfFooters(doc, 'Lead Analytics Report');

      this.openPdfPreview(doc, 'Lead Statistics Report', `Brahmadev_Lead_Analytics_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Error generating Lead Analytics PDF:', error);
      this.isGeneratingPdf = false;
    }
  }

  async generateMetaAdsPDF() {
    this.isGeneratingPdf = true;
    try {
      const logoBase64 = await this.loadLogoDataUrl();
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - (margin * 2);
      const rightEdge = pageWidth - margin;

      const summary = this.metaAdSpendData?.summary || {};
      const campaigns = this.metaAdSpendData?.campaigns || [];
      const dailyTrends = this.metaAdSpendData?.dailyTrends || [];

      const presetObj = this.adDatePresets.find(p => p.id === this.selectedDatePreset);
      const presetName = (this.selectedDatePreset === 'custom' && this.customStartDate && this.customEndDate)
        ? `${this.customStartDate} to ${this.customEndDate}`
        : (presetObj ? presetObj.label : this.selectedDatePreset);

      // Brand Colors (Matching Fixed Cost Estimate & Brahmadev Logo)
      const brandNavy: [number, number, number] = [20, 33, 61];     // #14213d Deep Navy
      const brandGold: [number, number, number] = [184, 146, 74];   // #b8924a Elegant Gold
      const brandSand: [number, number, number] = [250, 248, 242];  // #faf8f2 Warm Sand
      const textMain: [number, number, number] = [30, 30, 30];       // #1e1e1e Dark Text
      const textMuted: [number, number, number] = [100, 100, 100];   // #646464 Muted Text

      // 1. Top Decorative Brand Bar (Navy & Gold)
      doc.setFillColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.rect(0, 0, pageWidth, 3.5, 'F');
      doc.setFillColor(brandGold[0], brandGold[1], brandGold[2]);
      doc.rect(0, 3.5, pageWidth, 1, 'F');

      let currentY = 8;

      // 2. Logo on Left
      const logoSize = 22;
      try {
        if (logoBase64) {
          doc.addImage(logoBase64, 'PNG', margin, currentY, logoSize, logoSize);
        }
      } catch (err) {
        console.warn('Logo load fallback', err);
      }

      // 3. Header Information Block (Clean, No Invoice Content)
      const textStartX = margin + logoSize + 4;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.text('BRAHMADEV CONSTRUCTIONS', textStartX, currentY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);
      doc.text('Opp. Durgalakshmi Multiplex, Miraj Road, Athani, Karnataka - 591304', textStartX, currentY + 11);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2);
      doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.text('Phone: ', textStartX, currentY + 16.5);
      const phW = doc.getTextWidth('Phone: ');

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text('+91 88849 50068', textStartX + phW, currentY + 16.5);

      const emailVal = 'brahmadevaconstructions@gmail.com';
      const emailLabel = 'Email: ';
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const emailValW = doc.getTextWidth(emailVal);
      doc.text(emailVal, rightEdge, currentY + 16.5, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.text(emailLabel, rightEdge - emailValW, currentY + 16.5, { align: 'right' });

      currentY += 21;

      // Divider Line with Gold accent
      doc.setDrawColor(brandGold[0], brandGold[1], brandGold[2]);
      doc.setLineWidth(0.6);
      doc.line(margin, currentY, rightEdge, currentY);

      currentY += 5;

      // 4. Report Header Banner
      const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      doc.setFillColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.roundedRect(margin, currentY, contentWidth, 15, 2, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text(`META ADS PERFORMANCE REPORT`, margin + 6, currentY + 6.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(brandGold[0], brandGold[1], brandGold[2]);
      doc.text(`Preset: ${presetName.toUpperCase()}  •  Generated on: ${todayStr}`, margin + 6, currentY + 11.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(brandGold[0], brandGold[1], brandGold[2]);
      doc.text(`TOTAL SPEND: Rs. ${(summary.totalSpend || 0).toLocaleString('en-IN')}`, rightEdge - 6, currentY + 9.5, { align: 'right' });

      currentY += 19;

      // 5. KPI Summary Grid Box (3 Columns x 2 Rows mirroring the 6 UI KPI Cards)
      const colWidth = (contentWidth - 6) / 3;
      const cardHeight = 22;
      const gapY = 3;

      // --- ROW 1 ---
      // Card 1: Total Ad Spend
      let cardX = margin;
      doc.setFillColor(brandSand[0], brandSand[1], brandSand[2]);
      doc.setDrawColor(brandGold[0], brandGold[1], brandGold[2]);
      doc.setLineWidth(0.4);
      doc.roundedRect(cardX, currentY, colWidth, cardHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.text('TOTAL AD SPEND', cardX + 4, currentY + 5.5);
      doc.setFontSize(11);
      doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.text(`Rs. ${(summary.totalSpend || 0).toLocaleString('en-IN')}`, cardX + 4, currentY + 13);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(brandGold[0], brandGold[1], brandGold[2]);
      doc.text(`Incl. 18% GST: Rs. ${(summary.totalSpendWithGst || 0).toLocaleString('en-IN')}`, cardX + 4, currentY + 18.5);

      // Card 2: Leads Acquired
      cardX = margin + colWidth + 3;
      doc.setFillColor(brandSand[0], brandSand[1], brandSand[2]);
      doc.roundedRect(cardX, currentY, colWidth, cardHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.text('LEADS ACQUIRED', cardX + 4, currentY + 5.5);
      doc.setFontSize(12);
      doc.setTextColor(16, 150, 90);
      doc.text(`${(summary.totalLeads || 0).toLocaleString('en-IN')}`, cardX + 4, currentY + 13);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text('Total Form / Message Leads', cardX + 4, currentY + 18.5);

      // Card 3: Avg Cost Per Lead (CPL)
      cardX = margin + (colWidth * 2) + 6;
      doc.setFillColor(brandSand[0], brandSand[1], brandSand[2]);
      doc.roundedRect(cardX, currentY, colWidth, cardHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.text('AVG. COST PER LEAD (CPL)', cardX + 4, currentY + 5.5);
      doc.setFontSize(11);
      doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.text(`Rs. ${(summary.costPerLead || 0).toLocaleString('en-IN')}`, cardX + 4, currentY + 13);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(brandGold[0], brandGold[1], brandGold[2]);
      doc.text(`With GST: Rs. ${(summary.costPerLeadWithGst || 0).toLocaleString('en-IN')}`, cardX + 4, currentY + 18.5);

      // --- ROW 2 ---
      const row2Y = currentY + cardHeight + gapY;

      // Card 4: Impressions & Reach
      cardX = margin;
      doc.setFillColor(brandSand[0], brandSand[1], brandSand[2]);
      doc.roundedRect(cardX, row2Y, colWidth, cardHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.text('IMPRESSIONS & REACH', cardX + 4, row2Y + 5.5);
      doc.setFontSize(11);
      doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.text(`${(summary.totalImpressions || 0).toLocaleString('en-IN')}`, cardX + 4, row2Y + 13);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(`Reach: ${(summary.reach || 0).toLocaleString('en-IN')} users`, cardX + 4, row2Y + 18.5);

      // Card 5: Link Clicks & CTR
      cardX = margin + colWidth + 3;
      doc.setFillColor(brandSand[0], brandSand[1], brandSand[2]);
      doc.roundedRect(cardX, row2Y, colWidth, cardHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.text('LINK CLICKS & CTR', cardX + 4, row2Y + 5.5);
      doc.setFontSize(11);
      doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.text(`${(summary.totalClicks || 0).toLocaleString('en-IN')}`, cardX + 4, row2Y + 13);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(`CTR: ${summary.ctr || 0}%`, cardX + 4, row2Y + 18.5);

      // Card 6: Avg CPC & CPM
      cardX = margin + (colWidth * 2) + 6;
      doc.setFillColor(brandSand[0], brandSand[1], brandSand[2]);
      doc.roundedRect(cardX, row2Y, colWidth, cardHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.text('AVG. CPC & CPM', cardX + 4, row2Y + 5.5);
      doc.setFontSize(11);
      doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.text(`Rs. ${(summary.cpc || 0).toLocaleString('en-IN')}`, cardX + 4, row2Y + 13);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(`CPM: Rs. ${(summary.cpm || 0).toLocaleString('en-IN')}`, cardX + 4, row2Y + 18.5);

      currentY = row2Y + cardHeight + 8;

      // 6. Table 1: Campaign Performance Breakdown
      const campaignRows: any[] = campaigns.map((camp: any) => [
        camp.campaignName || 'Unnamed Campaign',
        `Rs. ${(camp.spend || 0).toLocaleString('en-IN')}`,
        `Rs. ${(camp.spendWithGst || 0).toLocaleString('en-IN')}`,
        (camp.leads || 0).toLocaleString('en-IN'),
        `Rs. ${(camp.cpl || 0).toLocaleString('en-IN')}`,
        `Rs. ${(camp.cplWithGst || 0).toLocaleString('en-IN')}`,
        (camp.clicks || 0).toLocaleString('en-IN'),
        `${camp.ctr || 0}%`,
        (camp.impressions || 0).toLocaleString('en-IN'),
        `Rs. ${camp.cpc || 0}`
      ]);

      if (campaignRows.length > 0) {
        campaignRows.push([
          { content: 'Total / Overall', styles: { fontStyle: 'bold' } },
          { content: `Rs. ${(summary.totalSpend || 0).toLocaleString('en-IN')}`, styles: { fontStyle: 'bold' } },
          { content: `Rs. ${(summary.totalSpendWithGst || 0).toLocaleString('en-IN')}`, styles: { fontStyle: 'bold' } },
          { content: `${(summary.totalLeads || 0).toLocaleString('en-IN')}`, styles: { fontStyle: 'bold' } },
          { content: `Rs. ${(summary.costPerLead || 0).toLocaleString('en-IN')}`, styles: { fontStyle: 'bold' } },
          { content: `Rs. ${(summary.costPerLeadWithGst || 0).toLocaleString('en-IN')}`, styles: { fontStyle: 'bold' } },
          { content: `${(summary.totalClicks || 0).toLocaleString('en-IN')}`, styles: { fontStyle: 'bold' } },
          { content: `${summary.ctr || 0}%`, styles: { fontStyle: 'bold' } },
          { content: `${(summary.totalImpressions || 0).toLocaleString('en-IN')}`, styles: { fontStyle: 'bold' } },
          { content: `Rs. ${summary.cpc || 0}`, styles: { fontStyle: 'bold' } }
        ]);
      }

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Campaign Name', 'Spend (Ex. GST)', 'Spend (Inc. GST)', 'Leads', 'Avg CPL', 'CPL (With GST)', 'Clicks', 'CTR', 'Impressions', 'Avg CPC']],
        body: campaignRows.length > 0 ? campaignRows : [['No active campaigns found', '-', '-', '-', '-', '-', '-', '-', '-', '-']],
        theme: 'grid',
        headStyles: { fillColor: brandNavy, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
        styles: { fontSize: 6.8, cellPadding: 2, textColor: textMain },
        alternateRowStyles: { fillColor: brandSand },
        columnStyles: {
          0: { cellWidth: 42 },
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right', fontStyle: 'bold' },
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right' },
          7: { halign: 'right' },
          8: { halign: 'right' },
          9: { halign: 'right' }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;

      // 7. Table 2: Daily Trends
      if (dailyTrends.length > 0) {
        if (currentY + 45 > pageHeight - 20) {
          doc.addPage();
          currentY = 16;
        }

        const dailyRows: any[] = dailyTrends.map((d: any) => {
          const dateObj = new Date(d.date);
          const dateFormatted = isNaN(dateObj.getTime())
            ? d.date
            : dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
          const spendWithGst = Math.round(d.spend * 1.18 * 100) / 100;
          const cpl = d.leads > 0 ? Math.round((d.spend / d.leads) * 100) / 100 : 0;
          const cplWithGst = d.leads > 0 ? Math.round((spendWithGst / d.leads) * 100) / 100 : 0;
          return [
            dateFormatted,
            `Rs. ${(d.spend || 0).toLocaleString('en-IN')}`,
            `Rs. ${spendWithGst.toLocaleString('en-IN')}`,
            (d.leads || 0).toLocaleString('en-IN'),
            d.leads > 0 ? `Rs. ${cpl.toLocaleString('en-IN')}` : '-',
            d.leads > 0 ? `Rs. ${cplWithGst.toLocaleString('en-IN')}` : '-'
          ];
        });

        autoTable(doc, {
          startY: currentY,
          margin: { left: margin, right: margin },
          head: [['Date', 'Daily Spend (Ex. GST)', 'Spend (Incl. 18% GST)', 'Leads Acquired', 'Daily CPL', 'CPL (With GST)']],
          body: dailyRows,
          theme: 'grid',
          headStyles: { fillColor: brandNavy, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
          styles: { fontSize: 7, cellPadding: 2, textColor: textMain },
          alternateRowStyles: { fillColor: brandSand },
          columnStyles: {
            0: { cellWidth: 35 },
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right', fontStyle: 'bold' },
            4: { halign: 'right' },
            5: { halign: 'right' }
          }
        });
      }

      currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : currentY + 10;

      // 8. Visual Trend Graphs & Charts Section (Appended below existing tables)
      const adDailyImg = await this.getChartImage(this.adDailyChartInstance, this.adDailyChartRef);
      if (adDailyImg) {
        const chartBoxHeight = 72;
        if (currentY + chartBoxHeight + 18 > pageHeight - 20) {
          doc.addPage();
          currentY = 16;
        }

        // Section Banner
        doc.setFillColor(brandNavy[0], brandNavy[1], brandNavy[2]);
        doc.roundedRect(margin, currentY, contentWidth, 10, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(255, 255, 255);
        doc.text('VISUAL PERFORMANCE TRENDS', margin + 6, currentY + 6.5);
        doc.setFontSize(7.5);
        doc.setTextColor(brandGold[0], brandGold[1], brandGold[2]);
        doc.text('Daily Ad Spend vs Leads Acquisition Breakdown', rightEdge - 6, currentY + 6.5, { align: 'right' });
        currentY += 14;

        this.drawChartPdfCard(
          doc,
          'Daily Ad Spend (Rs.) & Leads Acquired Breakdown',
          adDailyImg,
          margin,
          currentY,
          contentWidth,
          chartBoxHeight
        );
        currentY += chartBoxHeight + 8;
      }

      // Add Footers with date and time
      this.addPdfFooters(doc, `Meta Ads Report (${presetName})`);

      const fileDateTag = (this.selectedDatePreset === 'custom' && this.customStartDate && this.customEndDate)
        ? `${this.customStartDate}_to_${this.customEndDate}`
        : this.selectedDatePreset;
      this.openPdfPreview(doc, `Meta Ads Report (${presetName})`, `Brahmadev_Meta_Ads_${fileDateTag}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Error generating Meta Ads PDF:', error);
      this.isGeneratingPdf = false;
    }
  }

  // --- COMMON HELPER: ADD FOOTER WITH DATE & TIME & BRAND GOLD ACCENT ---
  addPdfFooters(doc: jsPDF, reportType: string) {
    const pageCount = (doc as any).internal.getNumberOfPages();
    const now = new Date();
    const timeFormatted = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ', ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Brand Colors
    const brandGold: [number, number, number] = [184, 146, 74];   // #b8924a Elegant Gold
    const brandNavy: [number, number, number] = [20, 33, 61];     // #14213d Deep Navy

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;

      // Divider line in Brand Gold
      doc.setDrawColor(brandGold[0], brandGold[1], brandGold[2]);
      doc.setLineWidth(0.4);
      doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

      // Left Footer: Date, Time & Company branding
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(90, 90, 90);
      doc.text(`Generated on: ${timeFormatted}  |  Brahmadev Constructions Internal (${reportType})`, margin, pageHeight - 6);

      // Right Footer: Page number in Brand Navy
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
    }
  }

  // --- COMMON HELPER: OPEN PDF PREVIEW MODAL ---
  async openPdfPreview(doc: jsPDF, title: string, fileName: string) {
    if (this.pdfBlobUrl) {
      URL.revokeObjectURL(this.pdfBlobUrl);
    }
    const blob = doc.output('blob');
    this.pdfBlobUrl = URL.createObjectURL(blob);
    this.pdfPreviewSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfBlobUrl);
    this.currentGeneratedDoc = doc;
    this.previewTitle = title;
    this.currentFileName = fileName;
    this.pdfPages = [];
    this.isPreviewModalOpen = true;
    this.isGeneratingPdf = false;

    // Render crisp in-UI page preview for mobile screens & desktop
    await this.renderPdfPages(doc);
  }

  async renderPdfPages(doc: jsPDF): Promise<void> {
    this.isRenderingPdfPages = true;
    this.pdfPages = [];
    this.cdr.detectChanges();

    try {
      await this.ensurePdfJsLoaded();

      if (typeof pdfjsLib !== 'undefined') {
        if (!pdfjsLib.GlobalWorkerOptions?.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        const arrayBuffer = doc.output('arraybuffer');
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const pages: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          // Scale 1.75 for sharp, retina text & numbers on mobile screens
          const viewport = page.getViewport({ scale: 1.75 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (context) {
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: context, viewport }).promise;
            pages.push(canvas.toDataURL('image/png'));
          }
        }

        this.pdfPages = pages;
      }
    } catch (err) {
      console.warn('PDF.js in-app render notice:', err);
    } finally {
      this.isRenderingPdfPages = false;
      this.cdr.detectChanges();
    }
  }

  private ensurePdfJsLoaded(): Promise<void> {
    if (typeof pdfjsLib !== 'undefined') {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const existingScript = document.getElementById('pdfjs-script');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => resolve());
        return;
      }

      const script = document.createElement('script');
      script.id = 'pdfjs-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => resolve();
      document.head.appendChild(script);
    });
  }

  closePreviewModal() {
    this.isPreviewModalOpen = false;
    this.pdfPages = [];
  }

  // --- DOWNLOAD OR SHARE FROM PREVIEW MODAL ---
  async downloadCurrentPDF() {
    if (!this.currentGeneratedDoc) return;
    this.isGeneratingPdf = true;

    try {
      const fileName = this.currentFileName || 'Brahmadev_Report.pdf';

      if (Capacitor.isNativePlatform()) {
        const pdfBase64 = this.currentGeneratedDoc.output('datauristring').split(',')[1];
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Cache
        });

        await Share.share({
          title: this.previewTitle,
          text: `Brahmadev Constructions Report: ${this.previewTitle}`,
          url: savedFile.uri,
          dialogTitle: 'Share / Save Report PDF'
        });
      } else {
        this.currentGeneratedDoc.save(fileName);
      }

      this.isGeneratingPdf = false;
      const toast = await this.toastCtrl.create({
        message: Capacitor.isNativePlatform() ? 'Report ready to view and share!' : 'Report PDF downloaded successfully!',
        duration: 2500,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();
    } catch (error: any) {
      this.isGeneratingPdf = false;
      // If user simply closed/cancelled the native share sheet, ignore silently
      if (error && (error.message?.includes('cancel') || error.message?.includes('dismiss') || error === 'Share canceled')) {
        return;
      }
      console.error('Error downloading/sharing PDF:', error);
      const toast = await this.toastCtrl.create({
        message: 'Failed to download PDF.',
        duration: 2500,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
  }

}
