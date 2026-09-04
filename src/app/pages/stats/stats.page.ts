import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  IonBadge
} from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
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
  funnelOutline, logoGoogle } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { Leads } from 'src/app/services/leads';

declare var google: any;

@Component({
  selector: 'app-stats',
  templateUrl: './stats.page.html',
  styleUrls: ['./stats.page.scss'],
  standalone: true,
  imports: [
    IonSpinner,
    IonBadge,
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

  constructor(private navCtrl: NavController, private service: Leads) {
    addIcons({arrowBackOutline,refreshOutline,analyticsOutline,logoGoogle,funnelOutline,informationCircleOutline,cashOutline,peopleOutline,trendingUpOutline,eyeOutline,fingerPrintOutline,optionsOutline,calendarOutline,logoFacebook,checkmarkCircleOutline,alertCircleOutline});
  }

  ngOnInit() {
    this.loadData();
    this.loadAdAccountStatus();
  }

  @HostListener('window:resize')
  onResize() {
    if (typeof google !== 'undefined' && google.visualization) {
      if (this.selectedTab === 'analytics' && !this.isLoading) {
        this.drawCharts();
      } else if (this.selectedTab === 'meta_ads' && !this.isAdsLoading && this.metaAdSpendData) {
        this.drawAdSpendChart();
      }
    }
  }

  back() {
    this.navCtrl.back();
  }

  switchTab(tab: 'analytics' | 'meta_ads' | 'google_ads') {
    this.selectedTab = tab;
    if (tab === 'meta_ads') {
      if (!this.metaAdSpendData) {
        this.loadMetaAdSpend();
      } else {
        setTimeout(() => this.drawAdSpendChart(), 150);
      }
    } else if (tab === 'analytics') {
      setTimeout(() => this.drawCharts(), 150);
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
    this.service.getLeads().subscribe({
      next: (res: any) => {
        this.leads = res || [];
        this.totalLeads = this.leads.length;
        this.processMonthlyData();
        this.processPlatformData();
        this.processResponseData();
        this.isLoading = false;

        // Ensure Google Charts loaded
        if (typeof google !== 'undefined') {
          google.charts.load('current', { packages: ['corechart'] });
          google.charts.setOnLoadCallback(() => {
            if (this.selectedTab === 'analytics') {
              this.drawCharts();
            }
          });
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  drawCharts() {
    this.drawMonthlyChart();
    this.drawPlatformChart();
    this.drawResponseChart();
    this.drawMonthlyStatusChart();
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
    if (!this.monthlyChartRef) return;

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

    const chart = new google.visualization.ColumnChart(this.monthlyChartRef.nativeElement);
    chart.draw(data, options);
  }

  drawPlatformChart() {
    if (!this.platformChartRef) return;

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

    const chart = new google.visualization.PieChart(this.platformChartRef.nativeElement);
    chart.draw(data, options);
  }

  drawResponseChart() {
    if (!this.responseChartRef) return;

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

    const chart = new google.visualization.LineChart(this.responseChartRef.nativeElement);
    chart.draw(data, options);
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
    if (!this.monthlyStatusChartRef) return;

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

    const chart = new google.visualization.ColumnChart(this.monthlyStatusChartRef.nativeElement);
    chart.draw(data, options);
  }

  /* ---------------------------------------------------- */
  /*                 META ADS SPEND METHODS               */
  /* ---------------------------------------------------- */

  selectDatePreset(presetId: string) {
    this.selectedDatePreset = presetId;
    this.loadMetaAdSpend();
  }

  loadAdAccountStatus() {
    this.service.getMetaAdAccountStatus().subscribe({
      next: (res: any) => {
        this.adAccountStatus = res;
      },
      error: () => {
        this.adAccountStatus = { connected: false, configured: false };
      }
    });
  }

  loadMetaAdSpend() {
    this.isAdsLoading = true;
    this.service.getMetaAdSpend(this.selectedDatePreset).subscribe({
      next: (res: any) => {
        this.metaAdSpendData = res;
        this.isAdsLoading = false;

        // Ensure google charts package is loaded, then draw
        if (typeof google !== 'undefined') {
          google.charts.load('current', { packages: ['corechart'] });
          google.charts.setOnLoadCallback(() => {
            setTimeout(() => this.drawAdSpendChart(), 100);
          });
        }
      },
      error: (err) => {
        console.error('Error fetching Meta Ad Spend:', err);
        this.isAdsLoading = false;
      }
    });
  }

  drawAdSpendChart() {
    if (!this.adDailyChartRef || !this.metaAdSpendData) return;

    const trends = this.metaAdSpendData.dailyTrends || [];
    if (trends.length === 0) return;

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

    const chart = new google.visualization.ComboChart(this.adDailyChartRef.nativeElement);
    chart.draw(data, options);
  }

}
