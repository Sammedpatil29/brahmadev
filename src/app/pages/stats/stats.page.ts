import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonSpinner } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { arrowBackOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { Leads } from 'src/app/services/leads';

declare var google: any;

@Component({
  selector: 'app-stats',
  templateUrl: './stats.page.html',
  styleUrls: ['./stats.page.scss'],
  standalone: true,
  imports: [IonSpinner, IonCardTitle, IonCardHeader, IonCardContent, IonCard, IonIcon, IonButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class StatsPage implements OnInit {

  @ViewChild('monthlyChart', { static: false }) monthlyChartRef!: ElementRef;
  @ViewChild('platformChart', { static: false }) platformChartRef!: ElementRef;
  @ViewChild('responseChart', { static: false }) responseChartRef!: ElementRef;
  @ViewChild('monthlyStatusChart', { static: false }) monthlyStatusChartRef!: ElementRef;

  leads: any[] = [];
  isLoading = true;
  monthlyData: { key: string; label: string; count: number }[] = [];
  platformData: { name: string; count: number }[] = [];
  responseData: { name: string; count: number }[] = [];
  totalLeads = 0;

  constructor(private navCtrl: NavController, private service: Leads) {
    addIcons({ arrowBackOutline });
  }

  ngOnInit() {
    this.loadData();
  }

  @HostListener('window:resize')
  onResize() {
    if (!this.isLoading && typeof google !== 'undefined' && google.visualization) {
      this.drawCharts();
    }
  }

  back() { this.navCtrl.back(); }

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

        // Wait for Google Charts to load, then draw
        google.charts.load('current', { packages: ['corechart'] });
        google.charts.setOnLoadCallback(() => {
          this.drawCharts();
        });
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

  drawMonthlyStatusChart() {
    if (!this.monthlyStatusChartRef) return;

    const allStatuses = this.responseData.map(r => r.name);
    if (allStatuses.length === 0) return;

    const headerRow: any[] = ['Month', ...allStatuses];
    const dataArray: any[] = [headerRow];

    const monthStatusMap = new Map<string, { label: string; statusCounts: Map<string, number> }>();
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
      const response = lead.response || 'Unknown';

      if (!monthStatusMap.has(key)) {
        monthStatusMap.set(key, { label, statusCounts: new Map<string, number>() });
      }

      const item = monthStatusMap.get(key)!;
      item.statusCounts.set(response, (item.statusCounts.get(response) || 0) + 1);
    });

    const sortedMonths = Array.from(monthStatusMap.entries()).sort(([a], [b]) => a.localeCompare(b));

    sortedMonths.forEach(([_, value]) => {
      const row: any[] = [value.label];
      allStatuses.forEach(status => {
        row.push(value.statusCounts.get(status) || 0);
      });
      dataArray.push(row);
    });

    const data = google.visualization.arrayToDataTable(dataArray);
    const options = {
      title: '',
      isStacked: true,
      legend: { position: 'none' },
      colors: [
        '#2dd36f', '#eb445a', '#3880ff', '#ffc409', '#3dc2ff',
        '#7044ff', '#e040fb', '#ff6d00', '#00bfa5', '#795548',
        '#607d8b', '#c2185b', '#0097a7', '#8bc34a'
      ],
      chartArea: { width: '88%', height: '70%', top: 25 },
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
      bar: { groupWidth: '55%' },
      backgroundColor: 'transparent',
      fontName: 'inherit'
    };

    const chart = new google.visualization.ColumnChart(this.monthlyStatusChartRef.nativeElement);
    chart.draw(data, options);
  }

}
