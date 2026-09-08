import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

declare var pdfjsLib: any;
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonModal,
  IonSpinner
} from '@ionic/angular/standalone';
import { NavController, ToastController, Platform } from '@ionic/angular';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  calculatorOutline,
  constructOutline,
  layersOutline,
  colorPaletteOutline,
  waterOutline,
  flashOutline,
  homeOutline,
  shareSocialOutline,
  copyOutline,
  checkmarkCircleOutline,
  chevronDownOutline,
  chevronUpOutline,
  refreshOutline,
  documentTextOutline,
  cubeOutline,
  sparklesOutline,
  businessOutline,
  downloadOutline,
  personOutline,
  locationOutline,
  callOutline,
  calendarOutline,
  closeOutline,
  eyeOutline,
  videocamOutline,
  cameraOutline,
  shieldCheckmarkOutline,
  wifiOutline,
  pricetagOutline,
  batteryChargingOutline
} from 'ionicons/icons';

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  percentage: number;
  ratePerSqft: number;
  totalCost: number;
  isExpanded: boolean;
  includedItems: string[];
  materialsHint: string;
}

export interface PackageTier {
  id: string;
  name: string;
  badge: string;
  description: string;
  baseRate: number; // ₹ per sqft
  interiorRate: number; // ₹ per sqft extra for interior
  color: string;
}

export interface ComplementaryService {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  marketValue: number;
  badge: string;
  features: string[];
}

export interface PaidAddon {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  unit: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  selected: boolean;
  features: string[];
}

export interface UtlSolarPlan {
  capacity: string;
  name: string;
  generation: string;
  bestFor: string;
  roofSpace: string;
  // On-Grid details
  onGridPrice: number;
  subsidy: number;
  onGridNetCost: number;
  // Off-Grid details with battery bank
  offGridTubularPrice: number;
  tubularBatterySpec: string;
  offGridLithiumPrice: number;
  lithiumBatterySpec: string;
  backupTime: string;
}

@Component({
  selector: 'app-fixed-cost-calculator',
  templateUrl: './fixed-cost-calculator.page.html',
  styleUrls: ['./fixed-cost-calculator.page.scss'],
  standalone: true,
  imports: [
    IonSpinner,
    IonModal,
    IonCardTitle,
    IonCardHeader,
    IonCardContent,
    IonCard,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule
  ]
})
export class FixedCostCalculatorPage implements OnInit {

  Math = Math;

  // Main input parameters
  plotLength: number | null = 30; // Length in ft
  plotWidth: number | null = 40;  // Width in ft
  builtUpArea: number = 1200; // in sq.ft
  selectedFloors: number = 1; // 1 = Ground, 2 = G+1, 3 = G+2, 4 = G+3
  selectedPackage: string = 'standard';
  wallType: string = 'red_brick'; // red_brick | aac_block | concrete_block
  plasterType: string = 'cement_plaster'; // cement_plaster | gypsum
  includeInterior: boolean = true;

  activeTab: 'categories' | 'materials' | 'complementary' | 'addons' = 'categories';

  // Complementary / Free Turnkey Services
  complementaryServices: ComplementaryService[] = [
    {
      id: 'planning',
      title: 'Architectural 2D Floor Planning',
      subtitle: 'Custom Vaastu-compliant floor layouts & space planning',
      description: 'Comprehensive 2D architectural drawings, room zoning, optimized space circulation, furniture layout, and cross-section elevations.',
      icon: 'document-text-outline',
      iconColor: '#0d6efd',
      iconBg: '#e0f2fe',
      marketValue: 18000,
      badge: '100% FREE',
      features: [
        'Vaastu Shastra compliant room positioning',
        'Dimensioned working architectural drawings',
        'Furniture, door & window schedule layout',
        'Sectional elevations and vertical zoning'
      ]
    },
    {
      id: 'structural',
      title: 'Structural Design & Column Drawings',
      subtitle: 'Certified engineering blueprints & steel schedules',
      description: 'Earthquake-resistant structural analysis, column & footing placement, beam schedules, and slab reinforcement layouts vetted by civil structural engineers.',
      icon: 'construct-outline',
      iconColor: '#d97706',
      iconBg: '#fef3c7',
      marketValue: 28000,
      badge: '100% FREE',
      features: [
        'Footing depth & foundation rebar details',
        'Plinth beam & column structural schedules',
        'Roof slab two-way reinforcement layouts',
        'Safe load bearing & seismic resistance checks'
      ]
    },
    {
      id: 'mep_drawings',
      title: 'Concealed MEP & Plumbing Schematics',
      subtitle: 'Precision conduit & pipe routing line drawings',
      description: 'Detailed schematic drawings for concealed CPVC/UPVC water lines, SWR drainage lines, electrical conduit routes, and distribution boards.',
      icon: 'flash-outline',
      iconColor: '#e11d48',
      iconBg: '#ffe4e6',
      marketValue: 14000,
      badge: '100% FREE',
      features: [
        'Concealed electrical conduit & DB circuit points',
        'Hot & cold water line plumbing layout',
        'SWR sewage, drainage & chamber connections',
        'Rainwater harvesting & overhead tank routing'
      ]
    },
    {
      id: 'sanction_drawings',
      title: 'Municipal Sanction & Approval Drawings',
      subtitle: 'Official documentation for building plan approval',
      description: 'Complete drawing blueprints prepared strictly adhering to local municipal / Gram Panchayat building bylaws for government license sanctioning.',
      icon: 'business-outline',
      iconColor: '#0284c7',
      iconBg: '#e0f2fe',
      marketValue: 12000,
      badge: '100% FREE',
      features: [
        'Local municipality bylaw compliance check',
        'Key plan, site plan, floor plans & cross sections',
        'Setback, coverage & FAR verification',
        'Ready-to-submit blueprint documentation'
      ]
    },
    {
      id: 'quality_testing',
      title: 'Concrete Test Report',
      subtitle: '7-day & 28-day compressive strength lab reports',
      description: 'Mandatory 7-day & 28-day concrete cube compressive strength laboratory testing and certified quality compliance reports.',
      icon: 'document-text-outline',
      iconColor: '#16a34a',
      iconBg: '#dcfce7',
      marketValue: 10000,
      badge: '100% FREE',
      features: [
        '7-day & 28-day concrete cube compressive strength tests',
        'Certified material testing lab reports',
        'Cement & aggregate mix ratio verification',
        'Structural concrete grade compliance certification'
      ]
    },
    {
      id: 'supervision',
      title: 'Dedicated Civil Engineer Site Supervision',
      subtitle: 'Stage-wise quality inspection & weekly progress reporting',
      description: 'Continuous on-site supervision by qualified civil engineers for shuttering alignment, steel binding audits, concrete pouring, and milestone tracking.',
      icon: 'person-outline',
      iconColor: '#4f46e5',
      iconBg: '#e0e7ff',
      marketValue: 30000,
      badge: 'INCLUDED',
      features: [
        'Steel rebar binding & cover block audits',
        'Concrete mix ratio & slump cone monitoring',
        'Curing schedule & brickwork alignment check',
        'Weekly WhatsApp photo & video progress updates'
      ]
    },
    {
      id: 'underground_sump',
      title: 'Underground RCC Water Sump (5,000L)',
      subtitle: 'Heavy-duty waterproof underground reservoir with cover',
      description: 'Complete reinforced cement concrete (RCC) underground water sump constructed with M25 grade concrete, dual-coat chemical waterproof plastering, and airtight manhole cover.',
      icon: 'water-outline',
      iconColor: '#0284c7',
      iconBg: '#e0f2fe',
      marketValue: 85000,
      badge: '100% FREE',
      features: [
        'M25 grade structural waterproof RCC construction',
        'Heavy-duty internal food-grade leakproof coating',
        'Airtight FRP / cast iron manhole cover',
        'Inlet/outlet plumbing & pump connection sleeve'
      ]
    },
    {
      id: 'wall_putty',
      title: '2-Coat Premium Wall Putty',
      subtitle: 'Smooth mirror-like paint-ready wall surface preparation',
      description: 'Dual-coat polymer-modified white cement wall putty application across all internal walls and ceilings for flawless smoothness, enhanced paint durability, and hairline crack resistance.',
      icon: 'color-palette-outline',
      iconColor: '#7c3aed',
      iconBg: '#f3e8ff',
      marketValue: 25000,
      badge: '100% FREE',
      features: [
        '2 coats of branded polymer-modified white cement putty (Birla / JK)',
        'Complete coverage on all internal walls and ceilings',
        'Fine machine sanding for ultra-smooth paint-ready finish',
        'Prevents moisture patches & enhances emulsion paint life'
      ]
    }
  ];

  get totalComplementaryValue(): number {
    return this.complementaryServices.reduce((sum, s) => sum + s.marketValue, 0);
  }

  // Optional Paid Upgrades & Add-ons
  paidAddons: PaidAddon[] = [
    {
      id: '3d_modelling',
      name: '3D Exterior Elevation & Modeling',
      tagline: 'High-definition photorealistic 3D building visualization (₹5,000/Floor)',
      description: 'Ultra-realistic 3D exterior views with daylight & night lighting, modern facade treatments, texture proposals, color palettes, and floor-wise architectural styling.',
      price: 5000,
      unit: '1 Floor (₹5,000/Floor)',
      icon: 'cube-outline',
      iconColor: '#9333ea',
      iconBg: '#f3e8ff',
      selected: false,
      features: [
        'Photorealistic 3D exterior rendering views',
        'Modern facade cladding & texture proposals',
        'Exterior color scheme & architectural lighting',
        'Customized floor-by-floor 3D design model'
      ]
    },
    {
      id: 'compound_wall',
      name: 'Compound Boundary Wall & Main Entrance Gate',
      tagline: 'Complete property perimeter wall & designer MS gate',
      description: 'Solid masonry boundary wall up to 120 Rft with coping, smooth cement plastering, weatherproof exterior paint, and designer MS main entrance gate.',
      price: 125000,
      unit: 'Up to 120 Rft',
      icon: 'business-outline',
      iconColor: '#d97706',
      iconBg: '#fef3c7',
      selected: false,
      features: [
        '5ft solid masonry boundary wall with coping & plastering',
        'Weatherproof primer & exterior apex paint finish',
        'Designer MS main entrance gate (sliding/swing)',
        'Built-in security wicket pedestrian gate'
      ]
    },
    {
      id: 'solar_power',
      name: 'UTL Solar Rooftop System (3kW)',
      tagline: '~12-15 units/day, ideal for 3-4 BHK | PM Surya Ghar Subsidy Eligible',
      description: 'UTL high-efficiency Monocrystalline solar panels, on-grid string inverter with Wi-Fi app monitoring, elevated galvanized mounting structure, and net-metering grid synchronization.',
      price: 175000,
      unit: '3 kW On-Grid • ~12-15 units/day',
      icon: 'flash-outline',
      iconColor: '#f59e0b',
      iconBg: '#fef3c7',
      selected: false,
      features: [
        'Tier-1 UTL Monocrystalline Half-cut solar PV panels',
        'UTL On-Grid string inverter with Wi-Fi mobile monitoring',
        'PM Surya Ghar: Muft Bijli Yojana subsidy processing support',
        'Hot-dip galvanized structure, DC/AC distribution boxes with SPD',
        '25-year panel performance warranty & 5-year inverter warranty'
      ]
    },
    {
      id: 'smart_home',
      name: 'Smart Automation & 4-Camera HD CCTV',
      tagline: 'Remote smartphone app control & 24/7 security',
      description: 'Smart Wi-Fi touch switch plates, video doorbell with two-way audio, digital biometric door lock, and 4-channel HD CCTV surveillance system.',
      price: 65000,
      unit: 'Complete Kit',
      icon: 'videocam-outline',
      iconColor: '#9333ea',
      iconBg: '#f3e8ff',
      selected: false,
      features: [
        '4 Full-HD night vision CCTV cameras + 1TB DVR',
        'Smart video doorbell with instant mobile notification',
        'Biometric fingerprint, RFID card & digital PIN lock',
        'Voice assistant (Alexa/Google) lighting controls'
      ]
    },
    {
      id: 'rainwater_harvesting',
      name: 'Rainwater Harvesting & Recharge Pit',
      tagline: 'Eco-friendly natural groundwater table recharging',
      description: 'Dedicated rooftop rainwater collection piping, multi-stage silica/gravel filtration chamber, and underground desilting percolation recharge pit.',
      price: 35000,
      unit: 'Full System',
      icon: 'water-outline',
      iconColor: '#16a34a',
      iconBg: '#dcfce7',
      selected: false,
      features: [
        'Dual-stage physical gravel & carbon filter chamber',
        'Percolation recharge pit with gravel bed',
        'Direct connection from terrace downpipes',
        'Gravity-fed low-maintenance design'
      ]
    },
    {
      id: 'borewell_system',
      name: 'Borewell Drilling & Submersible Pump',
      tagline: 'Independent uninterrupted freshwater source',
      description: 'Hydraulic rig borewell drilling (up to 350 ft), heavy-duty PVC casing pipes, 1.5 HP ISI copper-wound submersible pump, cable wiring, and starter panel.',
      price: 110000,
      unit: 'Up to 350 Ft',
      icon: 'construct-outline',
      iconColor: '#2563eb',
      iconBg: '#dbeafe',
      selected: false,
      features: [
        'Deep borewell drilling up to 350 feet depth',
        'Class-V heavy-duty PVC casing pipe insertion',
        '1.5 HP copper-wound ISI submersible pump',
        'Automatic water level controller & starter panel'
      ]
    },
    {
      id: 'terrace_waterproofing',
      name: 'Terrace Weather Proofing',
      tagline: 'Keeps top floor 4-6°C cooler & 100% leakproof (₹100/sq.ft)',
      description: '3-layer elastomeric polymer waterproofing membrane topped with high-SRI white solar reflective cooling thermal barrier paint.',
      price: 120000,
      unit: '1,200 sq.ft (₹100/sq.ft)',
      icon: 'sparkles-outline',
      iconColor: '#e11d48',
      iconBg: '#ffe4e6',
      selected: false,
      features: [
        '3-Coat elastomeric polymer waterproof membrane',
        'High Solar Reflective Index (SRI) top coating',
        'Reduces indoor top-floor temperature by 4°C - 6°C',
        '10-year resistance against terrace hairline leaks'
      ]
    }
  ];

  // Modal & Customer Details for PDF Quote
  isDownloadModalOpen: boolean = false;
  isPreviewModalOpen: boolean = false;
  isGeneratingPdf: boolean = false;
  customerName: string = '';
  customerPlace: string = '';
  customerContact: string = '';
  customerGst: string = '';
  todayDateFormatted: string = '';
  pdfPreviewSafeUrl: SafeResourceUrl | null = null;
  pdfBlobUrl: string | null = null;
  currentGeneratedDoc: jsPDF | null = null;
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

  // UTL Solar Rooftop Plans (On-Grid & Off-Grid with Battery Options)
  selectedSolarType: 'on_grid' | 'off_grid' = 'on_grid';
  selectedBatteryType: 'tubular' | 'lithium' = 'tubular';
  selectedSolarPlan: string = '3kW';

  utlSolarPlans: UtlSolarPlan[] = [
    {
      capacity: '1kW',
      name: '1 kW System',
      generation: '~4-5 units/day',
      bestFor: '1-2 BHK',
      roofSpace: '~100 sq.ft',
      onGridPrice: 70000,
      subsidy: 30000,
      onGridNetCost: 40000,
      offGridTubularPrice: 85000,
      tubularBatterySpec: '1x 150Ah C10 Solar Battery',
      offGridLithiumPrice: 105000,
      lithiumBatterySpec: '2.5 kWh LiFePO4 Lithium Battery',
      backupTime: '4-6 Hours'
    },
    {
      capacity: '2kW',
      name: '2 kW System',
      generation: '~8-10 units/day',
      bestFor: '2-3 BHK',
      roofSpace: '~200 sq.ft',
      onGridPrice: 125000,
      subsidy: 60000,
      onGridNetCost: 65000,
      offGridTubularPrice: 155000,
      tubularBatterySpec: '2x 150Ah C10 Solar Batteries',
      offGridLithiumPrice: 195000,
      lithiumBatterySpec: '5.0 kWh LiFePO4 Lithium Battery',
      backupTime: '6-8 Hours'
    },
    {
      capacity: '3kW',
      name: '3 kW System (Popular)',
      generation: '~12-15 units/day',
      bestFor: '3-4 BHK',
      roofSpace: '~300 sq.ft',
      onGridPrice: 175000,
      subsidy: 78000,
      onGridNetCost: 97000,
      offGridTubularPrice: 225000,
      tubularBatterySpec: '4x 150Ah C10 Solar Batteries',
      offGridLithiumPrice: 285000,
      lithiumBatterySpec: '7.5 kWh LiFePO4 Lithium Battery',
      backupTime: '8-10 Hours'
    },
    {
      capacity: '5kW',
      name: '5 kW System',
      generation: '~20-25 units/day',
      bestFor: 'Large Villa',
      roofSpace: '~500 sq.ft',
      onGridPrice: 265000,
      subsidy: 78000,
      onGridNetCost: 187000,
      offGridTubularPrice: 345000,
      tubularBatterySpec: '4x 200Ah C10 Solar Batteries',
      offGridLithiumPrice: 435000,
      lithiumBatterySpec: '10.0 kWh LiFePO4 Lithium Battery',
      backupTime: '10-12 Hours'
    },
    {
      capacity: '10kW',
      name: '10 kW System',
      generation: '~40-50 units/day',
      bestFor: 'Bungalow / Commercial',
      roofSpace: '~1,000 sq.ft',
      onGridPrice: 480000,
      subsidy: 78000,
      onGridNetCost: 402000,
      offGridTubularPrice: 620000,
      tubularBatterySpec: '8x 200Ah C10 Solar Batteries',
      offGridLithiumPrice: 780000,
      lithiumBatterySpec: '20.0 kWh LiFePO4 Lithium Battery',
      backupTime: 'Full Day Heavy Backup'
    }
  ];

  getCurrentSolarPlan(): UtlSolarPlan {
    return this.utlSolarPlans.find(p => p.capacity === this.selectedSolarPlan) || this.utlSolarPlans[2];
  }

  getSolarPrice(plan: UtlSolarPlan): number {
    if (this.selectedSolarType === 'on_grid') {
      return plan.onGridPrice;
    } else {
      return this.selectedBatteryType === 'tubular' ? plan.offGridTubularPrice : plan.offGridLithiumPrice;
    }
  }

  setSolarType(type: 'on_grid' | 'off_grid', event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.selectedSolarType = type;
    this.updateSolarAddonState();
  }

  setBatteryType(battery: 'tubular' | 'lithium', event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.selectedBatteryType = battery;
    this.updateSolarAddonState();
  }

  selectSolarPlan(capacity: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.selectedSolarPlan = capacity;
    this.updateSolarAddonState(true);
  }

  updateSolarAddonState(autoSelect: boolean = false) {
    const plan = this.getCurrentSolarPlan();
    const price = this.getSolarPrice(plan);
    const solarAddon = this.paidAddons.find(a => a.id === 'solar_power');
    if (solarAddon) {
      if (this.selectedSolarType === 'on_grid') {
        solarAddon.name = `UTL Solar On-Grid System (${plan.capacity})`;
        solarAddon.price = price;
        solarAddon.unit = `${plan.capacity} On-Grid • ${plan.generation}`;
        solarAddon.tagline = `${plan.generation}, ideal for ${plan.bestFor} | PM Surya Ghar Subsidy: Up to ₹${plan.subsidy.toLocaleString('en-IN')}`;
      } else {
        const batteryDesc = this.selectedBatteryType === 'tubular' ? plan.tubularBatterySpec : plan.lithiumBatterySpec;
        solarAddon.name = `UTL Solar Off-Grid System (${plan.capacity})`;
        solarAddon.price = price;
        solarAddon.unit = `${plan.capacity} Off-Grid • ${batteryDesc}`;
        solarAddon.tagline = `24/7 Power Cut Backup (${plan.backupTime}) • ${batteryDesc}`;
      }
      if (autoSelect) {
        solarAddon.selected = true;
      }
    }
    this.recalculate();
    this.cdr.markForCheck();
  }

  // Available Packages
  packages: PackageTier[] = [
    {
      id: 'basic',
      name: 'Economy',
      badge: 'Budget Friendly',
      description: 'Standard TMT steel, PPC cement, ceramic tiles, standard fittings.',
      baseRate: 1650,
      interiorRate: 250,
      color: '#6c757d'
    },
    {
      id: 'standard',
      name: 'Standard',
      badge: 'Most Popular',
      description: 'Fe550 steel, branded cement, vitrified tiles, modular switches, premium paint.',
      baseRate: 1850,
      interiorRate: 300,
      color: '#0d6efd'
    },
    {
      id: 'premium',
      name: 'Premium',
      badge: 'High Quality',
      description: 'Grade A steel, Italian/granite finish, Jaquar/Kohler bath fittings, UPVC windows.',
      baseRate: 2300,
      interiorRate: 400,
      color: '#198754'
    },
    {
      id: 'luxury',
      name: 'Luxury',
      badge: 'Ultra Modern',
      description: 'Architectural finishes, smart home automation, designer modular kitchen & woodwork.',
      baseRate: 2850,
      interiorRate: 500,
      color: '#6f42c1'
    }
  ];

  defaultPackageRates: { [id: string]: number } = {
    basic: 1650,
    standard: 1850,
    premium: 2300,
    luxury: 2850
  };

  defaultInteriorRates: { [id: string]: number } = {
    basic: 250,
    standard: 300,
    premium: 400,
    luxury: 500
  };

  isSetPriceModalOpen: boolean = false;
  tempPackageRates: { [id: string]: number } = {};
  tempInteriorRates: { [id: string]: number } = {};

  get currentInteriorRate(): number {
    const pkg = this.packages.find(p => p.id === this.selectedPackage) || this.packages[1];
    return pkg?.interiorRate ?? 300;
  }

  // Calculated Results
  totalCost: number = 0;
  baseConstructionCost: number = 0;
  selectedAddonsCost: number = 0;
  ratePerSqft: number = 0;
  totalAreaCalculated: number = 0;

  // Categorized items
  categories: CategoryItem[] = [];

  // Material BOQ estimations
  estimatedMaterials = {
    cementBags: 0,
    steelKg: 0,
    sandCft: 0,
    aggregateCft: 0,
    bricksCount: 0,
    flooringSqft: 0,
    paintLitres: 0
  };

  // Preset area chips
  presetAreas: number[] = [600, 800, 1000, 1200, 1500, 2000, 2500, 3000];

  constructor(
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private sanitizer: DomSanitizer,
    private platform: Platform,
    private cdr: ChangeDetectorRef
  ) {
    this.isMobile = this.platform.is('android') || this.platform.is('ios') || this.platform.is('mobile') || Capacitor.isNativePlatform();

    addIcons({
      arrowBackOutline,
      calculatorOutline,
      constructOutline,
      layersOutline,
      colorPaletteOutline,
      waterOutline,
      flashOutline,
      homeOutline,
      shareSocialOutline,
      copyOutline,
      checkmarkCircleOutline,
      chevronDownOutline,
      chevronUpOutline,
      refreshOutline,
      documentTextOutline,
      cubeOutline,
      sparklesOutline,
      businessOutline,
      downloadOutline,
      personOutline,
      locationOutline,
      callOutline,
      calendarOutline,
      closeOutline,
      eyeOutline,
      videocamOutline,
      cameraOutline,
      shieldCheckmarkOutline,
      wifiOutline,
      pricetagOutline,
      batteryChargingOutline
    });
  }

  ngOnInit() {
    this.checkAndShowBetaToast();
    this.updateTodayDate();
    this.recalculate();
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

  updateTodayDate() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = now.toLocaleString('en-IN', { month: 'short' });
    const year = now.getFullYear();
    this.todayDateFormatted = `${day} ${month} ${year}`;
  }

  back() { this.navCtrl.back(); }

  onDimensionChange() {
    const l = Number(this.plotLength);
    const w = Number(this.plotWidth);
    if (!isNaN(l) && !isNaN(w) && l > 0 && w > 0) {
      this.builtUpArea = Math.round(l * w);
    }
    this.recalculate();
  }

  onAreaDirectChange() {
    this.syncDimensionsFromArea();
    this.recalculate();
  }

  increaseArea() {
    this.builtUpArea = (this.builtUpArea || 0) + 100;
    this.syncDimensionsFromArea();
    this.recalculate();
  }

  decreaseArea() {
    this.builtUpArea = Math.max(100, (this.builtUpArea || 0) - 100);
    this.syncDimensionsFromArea();
    this.recalculate();
  }

  setPresetArea(area: number) {
    this.builtUpArea = area;
    this.syncDimensionsFromArea();
    this.recalculate();
  }

  syncDimensionsFromArea() {
    if (!this.builtUpArea || this.builtUpArea <= 0) return;
    const l = Number(this.plotLength);
    const w = Number(this.plotWidth);
    if (!isNaN(l) && l > 0) {
      this.plotWidth = Math.round((this.builtUpArea / l) * 10) / 10;
    } else if (!isNaN(w) && w > 0) {
      this.plotLength = Math.round((this.builtUpArea / w) * 10) / 10;
    } else {
      this.plotLength = 30;
      this.plotWidth = Math.round((this.builtUpArea / 30) * 10) / 10;
    }
  }

  setPackage(pkgId: string) {
    this.selectedPackage = pkgId;
    this.recalculate();
  }

  setFloors(floors: number) {
    this.selectedFloors = floors;
    this.recalculate();
  }

  toggleInterior() {
    this.includeInterior = !this.includeInterior;
    this.recalculate();
  }

  recalculate() {
    const pkg = this.packages.find(p => p.id === this.selectedPackage) || this.packages[1];
    let constructionBaseRate = pkg.baseRate;

    // Adjust for wall type
    if (this.wallType === 'aac_block') constructionBaseRate -= 30;
    if (this.wallType === 'concrete_block') constructionBaseRate -= 20;

    // Adjust for plaster type (Gypsum is cost & time effective)
    if (this.plasterType === 'gypsum') constructionBaseRate -= 25;

    // Total area considering floors (each floor adds builtup space)
    this.totalAreaCalculated = Math.max(100, (this.builtUpArea || 0) * (this.selectedFloors || 1));

    // Base construction package category rates (summing up to exactly 100% of constructionBaseRate)
    const civilRate = Math.round(constructionBaseRate * 0.42);
    const centringRate = Math.round(constructionBaseRate * 0.14);
    const finishingRate = Math.round(constructionBaseRate * 0.22);
    const plumbingRate = Math.round(constructionBaseRate * 0.12);
    const electricalRate = constructionBaseRate - (civilRate + centringRate + finishingRate + plumbingRate);

    // Interior rate (always extra on top of the package tier price)
    const interiorRate = this.includeInterior ? this.currentInteriorRate : 0;

    // Total construction rate per sq.ft and base construction cost
    this.ratePerSqft = constructionBaseRate + interiorRate;
    this.baseConstructionCost = Math.round(this.totalAreaCalculated * this.ratePerSqft);

    // Dynamic price calculation for floor-based add-ons (3D Elevation Modeling: ₹5,000 per floor)
    const modelingAddon = this.paidAddons.find(a => a.id === '3d_modelling');
    if (modelingAddon) {
      const floors = this.selectedFloors || 1;
      modelingAddon.price = floors * 5000;
      modelingAddon.unit = `${floors} Floor${floors > 1 ? 's' : ''} (₹5,000/Floor)`;
    }

    // Dynamic price calculation for area-based add-ons (Terrace Weather Proofing: ₹100 per sq.ft)
    const terraceAddon = this.paidAddons.find(a => a.id === 'terrace_waterproofing');
    if (terraceAddon) {
      const area = this.builtUpArea || 0;
      terraceAddon.price = area * 100;
      terraceAddon.unit = `${area.toLocaleString('en-IN')} sq.ft (₹100/sq.ft)`;
    }

    // Dynamic price calculation for solar add-on (UTL Solar Rooftop selected plan & grid type)
    const solarAddon = this.paidAddons.find(a => a.id === 'solar_power');
    if (solarAddon) {
      const plan = this.getCurrentSolarPlan();
      const price = this.getSolarPrice(plan);
      solarAddon.price = price;
      if (this.selectedSolarType === 'on_grid') {
        solarAddon.name = `UTL Solar On-Grid System (${plan.capacity})`;
        solarAddon.unit = `${plan.capacity} On-Grid • ${plan.generation}`;
      } else {
        const batteryDesc = this.selectedBatteryType === 'tubular' ? plan.tubularBatterySpec : plan.lithiumBatterySpec;
        solarAddon.name = `UTL Solar Off-Grid System (${plan.capacity})`;
        solarAddon.unit = `${plan.capacity} Off-Grid • ${batteryDesc}`;
      }
    }

    this.selectedAddonsCost = this.paidAddons.filter(a => a.selected).reduce((sum, a) => sum + a.price, 0);
    this.totalCost = this.baseConstructionCost + this.selectedAddonsCost;

    // Build categories
    const rawCategories: {
      id: string;
      name: string;
      icon: string;
      iconColor: string;
      iconBg: string;
      ratePerSqft: number;
      includedItems: string[];
      materialsHint: string;
    }[] = [
      {
        id: 'civil',
        name: 'Civil & Structure',
        icon: 'construct-outline',
        iconColor: '#d97706',
        iconBg: '#fef3c7',
        ratePerSqft: civilRate,
        includedItems: [
          'Excavation & foundation concrete (PCC/RCC)',
          'TMT Steel reinforcement (Fe550 / Fe500D)',
          'High grade cement (Ultratech/Birla/ACC)',
          this.wallType === 'red_brick' ? 'Red brick masonry with river sand' : (this.wallType === 'aac_block' ? 'AAC lightweight block masonry with block adhesive' : 'Solid concrete block masonry'),
          'Plinth beam, DPC water proof barrier & column casting'
        ],
        materialsHint: 'Includes foundation, columns, beams, load-bearing walls & structural mortar.'
      },
      {
        id: 'centring',
        name: 'Centring & Shuttering',
        icon: 'layers-outline',
        iconColor: '#0284c7',
        iconBg: '#e0f2fe',
        ratePerSqft: centringRate,
        includedItems: [
          'Steel / ply shuttering for floor slabs & beams',
          'Heavy duty prop scaffolding & levelling support',
          'Slab reinforcement placement & cover blocks',
          'Vibrator compaction & slab curing arrangements',
          'De-shuttering after specified curing period'
        ],
        materialsHint: 'Formwork for foundation, roof slabs, lintels, sunshades and staircase.'
      },
      {
        id: 'finishing',
        name: 'Finishing & Plastering',
        icon: 'color-palette-outline',
        iconColor: '#16a34a',
        iconBg: '#dcfce7',
        ratePerSqft: finishingRate,
        includedItems: [
          this.plasterType === 'gypsum' ? 'Smooth gypsum internal plaster (Zero crack / Paint ready)' : '2-Coat cement plaster with sponge finish',
          'External double-coat weatherproof sand-face plaster',
          'Vitrified flooring tiles (4x2 / 2x2 ft) & anti-skid bathroom tiles',
          'Premium 2-coat wall putty, primer & Asian Paints/Berger emulsion',
          'Main teakwood door + flush internal doors with stainless steel hardware',
          '3-Track sliding UPVC / Powder-coated aluminium windows with mosquito mesh'
        ],
        materialsHint: 'Complete internal & external surface treatments, tiles, doors and windows.'
      },
      {
        id: 'plumbing',
        name: 'Plumbing & Sanitary',
        icon: 'water-outline',
        iconColor: '#2563eb',
        iconBg: '#dbeafe',
        ratePerSqft: plumbingRate,
        includedItems: [
          'CPVC & UPVC concealed water supply piping (Astral/Ashirvad)',
          'SWR drainage & sewage pipeline with inspection chambers',
          'Premium sanitaryware: Wall-hung EWC, wash basins & health faucets',
          'Diverters, wall mixers, overhead showers & chrome fixtures (Jaquar/Cera)',
          '1000L 3-layer overhead water tank & underground sump connection'
        ],
        materialsHint: 'Full plumbing network, sanitary fixtures, drainage lines and water storage.'
      },
      {
        id: 'electrical',
        name: 'Electrification',
        icon: 'flash-outline',
        iconColor: '#e11d48',
        iconBg: '#ffe4e6',
        ratePerSqft: electricalRate,
        includedItems: [
          'Concealed fire-resistant (FRLS) copper wiring (Polycab/Finolex)',
          'Modular switch plates and sockets (Anchor Roma/Legrand)',
          'Distribution board with MCB/ELCB protection circuits',
          'Adequate light points, fan hooks, 16A power sockets for AC & Geysers',
          'Dedicated earthing system, TV cable & inverter wiring points'
        ],
        materialsHint: 'Concealed conduit piping, premium wiring, modular plates and circuit protection.'
      }
    ];

    if (this.includeInterior) {
      rawCategories.push({
        id: 'interior',
        name: 'Interiors & Woodwork',
        icon: 'home-outline',
        iconColor: '#9333ea',
        iconBg: '#f3e8ff',
        ratePerSqft: interiorRate,
        includedItems: [
          'Modular kitchen with soft-close tandem drawers & granite countertop',
          'Custom bedroom wardrobes with premium laminate finish & handles',
          'Modern gypsum false ceiling with warm LED profile/cove lighting',
          'Designer living room TV unit & shoe rack cabinetry',
          'Bathroom vanity counters with LED mirrors'
        ],
        materialsHint: 'Modular kitchen, storage wardrobes, false ceiling and aesthetic ambient lighting.'
      });
    }

    let allocatedPct = 0;
    this.categories = rawCategories.map((cat, idx) => {
      let pct = Math.round((cat.ratePerSqft / this.ratePerSqft) * 100);
      if (idx === rawCategories.length - 1) {
        pct = Math.max(1, 100 - allocatedPct);
      } else {
        allocatedPct += pct;
      }
      return {
        ...cat,
        percentage: pct,
        totalCost: Math.round(cat.ratePerSqft * this.totalAreaCalculated),
        isExpanded: false
      };
    });

    // Material Estimations
    this.estimatedMaterials = {
      cementBags: Math.round(this.totalAreaCalculated * 0.42),
      steelKg: Math.round(this.totalAreaCalculated * 3.8),
      sandCft: Math.round(this.totalAreaCalculated * 1.8),
      aggregateCft: Math.round(this.totalAreaCalculated * 1.35),
      bricksCount: Math.round(this.totalAreaCalculated * (this.wallType === 'red_brick' ? 18 : 3.5)),
      flooringSqft: Math.round(this.totalAreaCalculated * 1.15),
      paintLitres: Math.round(this.totalAreaCalculated * 0.18)
    };
    this.cdr.markForCheck();
  }

  toggleCategory(cat: CategoryItem) {
    cat.isExpanded = !cat.isExpanded;
  }

  toggleAddon(addon: PaidAddon) {
    addon.selected = !addon.selected;
    this.recalculate();
  }

  getSelectedAddonsCount(): number {
    return this.paidAddons.filter(a => a.selected).length;
  }

  getSelectedAddons(): PaidAddon[] {
    return this.paidAddons.filter(a => a.selected);
  }

  openDownloadModal() {
    this.updateTodayDate();
    this.isDownloadModalOpen = true;
  }

  closeDownloadModal() {
    this.isDownloadModalOpen = false;
  }

  openSetPriceModal() {
    this.tempPackageRates = {};
    this.tempInteriorRates = {};
    this.packages.forEach(pkg => {
      this.tempPackageRates[pkg.id] = pkg.baseRate;
      this.tempInteriorRates[pkg.id] = pkg.interiorRate;
    });
    this.isSetPriceModalOpen = true;
    this.cdr.markForCheck();
  }

  closeSetPriceModal() {
    this.isSetPriceModalOpen = false;
    this.cdr.markForCheck();
  }

  resetDefaultRates() {
    this.packages.forEach(pkg => {
      if (this.defaultPackageRates[pkg.id]) {
        this.tempPackageRates[pkg.id] = this.defaultPackageRates[pkg.id];
      }
      if (this.defaultInteriorRates[pkg.id]) {
        this.tempInteriorRates[pkg.id] = this.defaultInteriorRates[pkg.id];
      }
    });
    this.cdr.markForCheck();
  }

  onRateChange(pkgId: string, value: any) {
    const num = Number(value);
    if (!isNaN(num)) {
      this.tempPackageRates[pkgId] = num;
    }
  }

  onInteriorRateChange(pkgId: string, value: any) {
    const num = Number(value);
    if (!isNaN(num)) {
      this.tempInteriorRates[pkgId] = num;
    }
  }

  async applyCustomRates() {
    // Create new array & object references so Angular template tracking immediately detects and re-renders
    this.packages = this.packages.map(pkg => {
      const inputVal = this.tempPackageRates[pkg.id];
      const parsedVal = typeof inputVal === 'string' ? parseFloat(inputVal) : Number(inputVal);
      const inputIntVal = this.tempInteriorRates[pkg.id];
      const parsedIntVal = typeof inputIntVal === 'string' ? parseFloat(inputIntVal) : Number(inputIntVal);
      return {
        ...pkg,
        baseRate: (!isNaN(parsedVal) && parsedVal > 0) ? parsedVal : pkg.baseRate,
        interiorRate: (!isNaN(parsedIntVal) && parsedIntVal >= 0) ? parsedIntVal : pkg.interiorRate
      };
    });

    // Re-run all cost and material estimations
    this.recalculate();
    this.cdr.detectChanges();
    this.isSetPriceModalOpen = false;

    const currentPkg = this.packages.find(p => p.id === this.selectedPackage) || this.packages[1];
    const toast = await this.toastCtrl.create({
      message: `Prices updated! Active package (${currentPkg.name}) base is ₹${currentPkg.baseRate}/sq.ft (Interior: +₹${currentPkg.interiorRate}/sq.ft). Total: ₹${this.totalCost.toLocaleString('en-IN')}`,
      duration: 3000,
      position: 'bottom',
      color: 'dark'
    });
    await toast.present();
  }

  async copyEstimate() {
    const pkg = this.packages.find(p => p.id === this.selectedPackage);
    let text = `🏗️ *BRAHMADEV CONSTRUCTIONS - BUILDING ESTIMATE*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📐 *Built-up Area:* ${this.builtUpArea} sq.ft (${this.getFloorsLabel()})${this.plotLength && this.plotWidth ? ` [${this.plotLength}ft × ${this.plotWidth}ft]` : ''}\n`;
    text += `📦 *Package:* ${pkg?.name} (${pkg?.badge}) - ₹${pkg?.baseRate}/sq.ft Base\n`;
    text += `💰 *Effective Rate:* ₹${this.ratePerSqft.toLocaleString('en-IN')}/sq.ft${this.includeInterior ? ` (Base: ₹${pkg?.baseRate} + Interior: +₹${this.currentInteriorRate})` : ''}\n`;
    text += `🛋️ *Modular Interiors:* ${this.includeInterior ? `Included (+₹${this.currentInteriorRate}/sq.ft Extra)` : 'Not Included'}\n`;
    text += `🏷️ *Base Construction Cost:* ₹${this.baseConstructionCost.toLocaleString('en-IN')}\n`;

    const selectedAddons = this.getSelectedAddons();
    if (selectedAddons.length > 0) {
      text += `\n⚡ *OPTIONAL UPGRADES & PAID ADD-ONS (${selectedAddons.length} Selected):*\n`;
      selectedAddons.forEach((a, idx) => {
        text += `${idx + 1}. *${a.name}* (${a.unit}) - ₹${a.price.toLocaleString('en-IN')}\n`;
      });
      text += `↳ *Add-ons Subtotal:* ₹${this.selectedAddonsCost.toLocaleString('en-IN')}\n`;
      text += `💰 *GRAND TOTAL COST:* ₹${this.totalCost.toLocaleString('en-IN')} *(Inclusive of all Taxes)*\n`;
    } else {
      text += `🏷️ *Total Estimated Cost:* ₹${this.totalCost.toLocaleString('en-IN')} *(Inclusive of all Taxes)*\n`;
    }

    text += `\n📊 *CATEGORY BREAKDOWN:*\n`;
    this.categories.forEach((c, index) => {
      text += `${index + 1}. *${c.name}* (${c.percentage}%)\n   ↳ ₹${c.totalCost.toLocaleString('en-IN')} (₹${c.ratePerSqft}/sq.ft)\n`;
    });

    text += `\n🎁 *COMPLEMENTARY SERVICES INCLUDED (100% FREE - Save ₹${this.totalComplementaryValue.toLocaleString('en-IN')}+):*\n`;
    this.complementaryServices.forEach((s, idx) => {
      text += `✓ ${s.title} (Worth ₹${s.marketValue.toLocaleString('en-IN')}) -> FREE\n`;
    });

    text += `\n📦 *KEY MATERIAL REQUIREMENTS:*\n`;
    text += `• Cement: ~${this.estimatedMaterials.cementBags} Bags\n`;
    text += `• TMT Steel: ~${(this.estimatedMaterials.steelKg / 1000).toFixed(2)} Metric Tons\n`;
    text += `• Flooring: ~${this.estimatedMaterials.flooringSqft} sq.ft\n`;
    text += `• Paint: ~${this.estimatedMaterials.paintLitres} Litres\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📞 *Brahmadev Constructions & Engineering*\n`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        const toast = await this.toastCtrl.create({
          message: 'Estimate copied to clipboard!',
          duration: 2000,
          position: 'bottom',
          color: 'success'
        });
        await toast.present();
      }
    } catch {
      // fallback
    }
  }

  getFloorsLabel(): string {
    switch (this.selectedFloors) {
      case 1: return 'Ground Floor';
      case 2: return 'Ground + 1 Floor';
      case 3: return 'Ground + 2 Floors';
      case 4: return 'Ground + 3 Floors';
      default: return `${this.selectedFloors} Floors`;
    }
  }

  getWallLabel(): string {
    if (this.wallType === 'red_brick') return 'Red Clay Bricks';
    if (this.wallType === 'aac_block') return 'AAC Lightweight Blocks';
    return 'Solid Concrete Blocks';
  }

  getPlasterLabel(): string {
    if (this.plasterType === 'gypsum') return 'Smooth Gypsum Plaster';
    return 'Traditional Cement Plaster';
  }

  // Load logo from assets/Brahmadev Constructions.png into a base64 DataURL
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

  // --- BUILD PDF DOCUMENT OBJECT ---
  async buildPDFDocument(): Promise<jsPDF> {
    const logoBase64 = await this.loadLogoDataUrl();

    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);

    // Brand Color Coding from Brahmadev Constructions Logo
    const brandNavy: [number, number, number] = [20, 33, 61];     // #14213d Deep Navy
    const brandGold: [number, number, number] = [184, 146, 74];   // #b8924a Elegant Gold
    const brandSand: [number, number, number] = [250, 248, 242];  // #faf8f2 Warm Sand
    const textMain: [number, number, number] = [30, 30, 30];       // #1e1e1e Dark Text
    const textMuted: [number, number, number] = [100, 100, 100];   // #646464 Muted Text

    const quoteNumber = `BC-FC-EST-${Date.now().toString().slice(-6)}`;
    const selectedPkg = this.packages.find(p => p.id === this.selectedPackage) || this.packages[1];

    // ==========================================
    // PAGE 1: FULL-WIDTH ALIGNED HEADER (FIRST PAGE ONLY)
    // ==========================================
    let currentY = 10;
    const rightEdge = pageWidth - margin;

    // 1. Top Decorative Brand Bar (Navy & Gold)
    doc.setFillColor(brandNavy[0], brandNavy[1], brandNavy[2]);
    doc.rect(0, 0, pageWidth, 3.5, 'F');
    doc.setFillColor(brandGold[0], brandGold[1], brandGold[2]);
    doc.rect(0, 3.5, pageWidth, 1, 'F');

    // 2. Logo on Left
    const logoSize = 27;
    const logoX = margin;
    try {
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', logoX, currentY, logoSize, logoSize);
      }
    } catch (err) {
      console.warn('Logo load fallback', err);
    }

    // 3. Full-Width Information Block
    const textStartX = margin + logoSize + 4;

    // Line 1: BRAHMADEV CONSTRUCTIONS
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
    doc.text('BRAHMADEV CONSTRUCTIONS', textStartX, currentY + 5.5);

    // Line 2: Address
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    doc.text('Opp. Durgalakshmi Multiplex, Miraj Road, Athani, Karnataka - 591304', textStartX, currentY + 11.5);

    // Line 3: Phone (Left) & Email (Right Aligned)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
    doc.text('Phone: ', textStartX, currentY + 17);
    const phW = doc.getTextWidth('Phone: ');

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('+91 88849 50068', textStartX + phW, currentY + 17);

    // Email aligned to right edge
    const emailVal = 'brahmadevaconstructions@gmail.com';
    const emailLabel = 'Email: ';
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const emailValW = doc.getTextWidth(emailVal);
    doc.text(emailVal, rightEdge, currentY + 17, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
    doc.text(emailLabel, rightEdge - emailValW, currentY + 17, { align: 'right' });

    // Line 4: GSTIN (Left) & PAN Number (Right Aligned)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
    doc.text('GSTIN: ', textStartX, currentY + 22.5);
    const gstW = doc.getTextWidth('GSTIN: ');

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('29FHSPB9789R1ZO', textStartX + gstW, currentY + 22.5);

    // PAN Number aligned to right edge
    const panVal = 'FHSPB9789R';
    const panLabel = 'PAN Number: ';
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const panValW = doc.getTextWidth(panVal);
    doc.text(panVal, rightEdge, currentY + 22.5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
    doc.text(panLabel, rightEdge - panValW, currentY + 22.5, { align: 'right' });

    currentY += 27;

    // Divider Line with Gold accent spanning full width
    doc.setDrawColor(brandGold[0], brandGold[1], brandGold[2]);
    doc.setLineWidth(0.6);
    doc.line(margin, currentY, rightEdge, currentY);

    currentY += 4;

    // 4. Customer & Estimate Details Box (FIRST PAGE ONLY)
    const hasCustGst = !!this.customerGst.trim();
    const custBoxHeight = hasCustGst ? 24 : 19;

    doc.setFillColor(brandSand[0], brandSand[1], brandSand[2]);
    doc.roundedRect(margin, currentY, contentWidth, custBoxHeight, 2, 2, 'F');
    doc.setDrawColor(brandGold[0], brandGold[1], brandGold[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, currentY, contentWidth, custBoxHeight, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
    doc.text(`CUSTOMER: ${this.customerName.toUpperCase()}`, margin + 4, currentY + 6);
    doc.text(`SITE LOCATION: ${this.customerPlace.toUpperCase()}`, margin + (contentWidth / 2), currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(textMain[0], textMain[1], textMain[2]);
    if (this.customerContact) {
      doc.text(`Contact: ${this.customerContact}`, margin + 4, currentY + 12);
    } else {
      doc.text(`Package Tier: ${selectedPkg.name} (${selectedPkg.badge})`, margin + 4, currentY + 12);
    }
    doc.text(`Date: ${this.todayDateFormatted}  |  Estimate No: ${quoteNumber}`, margin + (contentWidth / 2), currentY + 12);

    if (hasCustGst) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.text(`Customer GSTIN: ${this.customerGst.toUpperCase()}`, margin + 4, currentY + 18);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textMain[0], textMain[1], textMain[2]);
      doc.text(`Scope: ${this.totalAreaCalculated.toLocaleString('en-IN')} sq.ft (${this.getFloorsLabel()})`, margin + (contentWidth / 2), currentY + 18);
    }

    currentY += custBoxHeight + 5;

    // ==========================================
    // 5. EXECUTIVE SUMMARY HIGHLIGHT BOX
    // ==========================================
    doc.setFillColor(brandNavy[0], brandNavy[1], brandNavy[2]);
    doc.roundedRect(margin, currentY, contentWidth, 23, 2.5, 2.5, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(brandGold[0], brandGold[1], brandGold[2]);
    doc.text('TOTAL ESTIMATED CONSTRUCTION COST (INCL. ALL TAXES)', margin + 6, currentY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(255, 255, 255);
    doc.text(`Rs. ${this.totalCost.toLocaleString('en-IN')}`, margin + 6, currentY + 15);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 200);
    if (this.selectedAddonsCost > 0) {
      doc.text(`(Base: Rs. ${this.baseConstructionCost.toLocaleString('en-IN')} + ${this.getSelectedAddonsCount()} Add-ons: Rs. ${this.selectedAddonsCost.toLocaleString('en-IN')} • Inclusive of all Taxes)`, margin + 6, currentY + 20);
    } else {
      doc.text(`(All-inclusive fixed cost estimate • Inclusive of all Taxes)`, margin + 6, currentY + 20);
    }

    // Right Stats inside banner
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(brandGold[0], brandGold[1], brandGold[2]);
    doc.text(`Rs. ${this.ratePerSqft.toLocaleString('en-IN')} / sq.ft`, pageWidth - margin - 6, currentY + 10, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(255, 255, 255);
    doc.text(`${this.builtUpArea} sq.ft Built-up${this.plotLength && this.plotWidth ? ' (' + this.plotLength + 'x' + this.plotWidth + ' ft)' : ''} • ${this.getFloorsLabel()}`, pageWidth - margin - 6, currentY + 15, { align: 'right' });
    doc.text(`Masonry: ${this.getWallLabel()} | Plaster: ${this.getPlasterLabel()} | Interiors: ${this.includeInterior ? 'Included (+Rs. ' + this.currentInteriorRate + '/sqft)' : 'Excluded'}`, pageWidth - margin - 6, currentY + 20, { align: 'right' });

    currentY += 28;

    // ==========================================
    // 6. CATEGORY SUMMARY TABLE
    // ==========================================
    const catTableBody = this.categories.map((cat, idx) => [
      `${idx + 1}`,
      cat.name,
      `${cat.percentage}%`,
      `Rs. ${cat.ratePerSqft}/sqft`,
      `Rs. ${cat.totalCost.toLocaleString('en-IN')}`
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['#', 'Construction Category', 'Share (%)', 'Rate / Sq.Ft', 'Sub Total (INR)']],
      body: catTableBody,
      theme: 'grid',
      headStyles: {
        fillColor: brandNavy,
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 'auto', fontStyle: 'bold' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 38, halign: 'right', fontStyle: 'bold' }
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: textMain
      },
      alternateRowStyles: {
        fillColor: brandSand
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // ==========================================
    // 7. DETAILED WORK SCOPE & INCLUSIONS (FULL ACCORDION DATA)
    // ==========================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
    doc.text('DETAILED WORK SCOPE & COMMITTED SPECIFICATIONS', margin, currentY);

    currentY += 4;

    const detailedBody: any[] = [];
    this.categories.forEach((cat) => {
      // Category Header Row
      detailedBody.push([
        {
          content: `${cat.name.toUpperCase()}  •  Rs. ${cat.totalCost.toLocaleString('en-IN')} (${cat.percentage}% of Project - Rs. ${cat.ratePerSqft}/sqft)`,
          colSpan: 2,
          styles: {
            fillColor: brandSand,
            textColor: brandNavy,
            fontStyle: 'bold',
            fontSize: 8.2
          }
        }
      ]);

      // Specific Inclusions from Accordion
      cat.includedItems.forEach((specItem) => {
        detailedBody.push(['•', specItem]);
      });
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      body: detailedBody,
      theme: 'plain',
      columnStyles: {
        0: { cellWidth: 6, halign: 'center', textColor: brandGold, fontStyle: 'bold' },
        1: { cellWidth: 'auto', fontSize: 7.8, textColor: textMain }
      },
      styles: {
        cellPadding: 1.3
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // Check if space remaining is sufficient for BOQ table or add page
    if (currentY > pageHeight - 75) {
      doc.addPage();
      currentY = 16;
    }

    // ==========================================
    // 8. ESTIMATED RAW MATERIAL REQUIREMENTS (BOQ)
    // ==========================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
    doc.text('ESTIMATED MATERIAL REQUIREMENTS (BOQ THUMB RULES)', margin, currentY);

    currentY += 3;

    const boqBody = [
      ['1', 'Cement (53/43 Grade)', `${this.estimatedMaterials.cementBags} Bags`, 'Structural concrete, foundation & masonry'],
      ['2', 'TMT Steel (Fe550 / Fe500D)', `${(this.estimatedMaterials.steelKg / 1000).toFixed(2)} Metric Tons (${this.estimatedMaterials.steelKg} kg)`, 'Primary reinforcement for slabs, beams & columns'],
      ['3', 'Wall Masonry Units', `${this.estimatedMaterials.bricksCount.toLocaleString()} Units`, this.getWallLabel()],
      ['4', 'River Sand / M-Sand', `${this.estimatedMaterials.sandCft} cft`, 'Mortar for plastering & masonry'],
      ['5', 'Coarse Aggregate (20mm/40mm)', `${this.estimatedMaterials.aggregateCft} cft`, 'Concrete casting for foundation & slabs'],
      ['6', 'Flooring & Wall Tiles', `${this.estimatedMaterials.flooringSqft} sq.ft`, 'Living, bedroom, kitchen & anti-skid bathroom tiles'],
      ['7', 'Wall Putty & Emulsion Paint', `${this.estimatedMaterials.paintLitres} Litres`, '2-Coat putty, primer & premium emulsion']
    ];

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['#', 'Raw Material Item', 'Estimated Quantity', 'Remarks / Usage']],
      body: boqBody,
      theme: 'grid',
      headStyles: {
        fillColor: brandNavy,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 1.8,
        textColor: textMain
      },
      alternateRowStyles: {
        fillColor: brandSand
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // ==========================================
    // 9. SELECTED OPTIONAL UPGRADES & PAID ADD-ONS
    // ==========================================
    const selectedAddons = this.getSelectedAddons();
    if (selectedAddons.length > 0) {
      if (currentY > pageHeight - 75) {
        doc.addPage();
        currentY = 16;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.text(`SELECTED OPTIONAL UPGRADES & PAID ADD-ONS (TOTAL: RS. ${this.selectedAddonsCost.toLocaleString('en-IN')})`, margin, currentY);

      currentY += 3;

      const addonBody = selectedAddons.map((a, idx) => [
        `${idx + 1}`,
        a.name,
        a.description,
        a.unit,
        `Rs. ${a.price.toLocaleString('en-IN')}`
      ]);

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['#', 'Add-on Item', 'Specification / Scope', 'Capacity / Unit', 'Price (INR)']],
        body: addonBody,
        theme: 'grid',
        headStyles: {
          fillColor: brandNavy,
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 7, halign: 'center' },
          1: { cellWidth: 48, fontStyle: 'bold', textColor: brandNavy },
          2: { cellWidth: 'auto', fontSize: 7.2 },
          3: { cellWidth: 26, halign: 'center', fontSize: 7.2 },
          4: { cellWidth: 28, halign: 'right', fontStyle: 'bold', textColor: brandNavy }
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 1.8,
          textColor: textMain
        },
        alternateRowStyles: {
          fillColor: brandSand
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;
    }

    // ==========================================
    // 10. COMPLEMENTARY SERVICES INCLUDED (100% FREE)
    // ==========================================
    if (currentY > pageHeight - 85) {
      doc.addPage();
      currentY = 16;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
    doc.text(`COMPLEMENTARY SERVICES INCLUDED (WORTH RS. ${this.totalComplementaryValue.toLocaleString('en-IN')} - ZERO COST)`, margin, currentY);

    currentY += 3;

    const compBody = this.complementaryServices.map((s, idx) => [
      `${idx + 1}`,
      s.title,
      s.subtitle,
      `Rs. ${s.marketValue.toLocaleString('en-IN')}`,
      '100% FREE'
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['#', 'Complementary Service', 'Deliverables / Scope', 'Market Value', 'Our Charge']],
      body: compBody,
      theme: 'grid',
      headStyles: {
        fillColor: brandNavy,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 7, halign: 'center' },
        1: { cellWidth: 50, fontStyle: 'bold', textColor: brandNavy },
        2: { cellWidth: 'auto', fontSize: 7.2 },
        3: { cellWidth: 26, halign: 'right', textColor: textMuted },
        4: { cellWidth: 25, halign: 'center', fontStyle: 'bold', textColor: [22, 163, 74] }
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 1.8,
        textColor: textMain
      },
      alternateRowStyles: {
        fillColor: brandSand
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    if (currentY > pageHeight - 45) {
      doc.addPage();
      currentY = 16;
    }

    // ==========================================
    // 11. TERMS & SIGNATURE SECTION
    // ==========================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
    doc.text('TERMS & CONDITIONS:', margin, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text([
      '1. Rates are based on current market material costs and standard soil conditions.',
      '2. Final estimated cost is fully inclusive of all applicable statutory taxes.',
      '3. Electricity and water required during the construction period to be supplied by the client.',
      '4. Stage-wise payment milestones to be followed as per the mutual construction contract.'
    ], margin, currentY + 4);

    // Signature line (Right Aligned)
    doc.setDrawColor(brandGold[0], brandGold[1], brandGold[2]);
    doc.setLineWidth(0.4);
    doc.line(pageWidth - margin - 45, currentY + 18, pageWidth - margin, currentY + 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
    doc.text('Authorized Signatory', pageWidth - margin, currentY + 22, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text('Brahmadev Constructions', pageWidth - margin, currentY + 26, { align: 'right' });

    // ==========================================
    // 10. WATERMARK ON ALL PAGES & CLEAN FOOTER
    // ==========================================
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Center Watermark on ALL Pages
      if (logoBase64) {
        try {
          if ((doc as any).saveGraphicsState && (doc as any).setGState) {
            (doc as any).saveGraphicsState();
            (doc as any).setGState(new (doc as any).GState({ opacity: 0.08 }));
            const wmSize = 90;
            const wmX = (pageWidth - wmSize) / 2;
            const wmY = (pageHeight - wmSize) / 2;
            doc.addImage(logoBase64, 'PNG', wmX, wmY, wmSize, wmSize);
            (doc as any).restoreGraphicsState();
          } else {
            const wmSize = 80;
            const wmX = (pageWidth - wmSize) / 2;
            const wmY = (pageHeight - wmSize) / 2;
            doc.addImage(logoBase64, 'PNG', wmX, wmY, wmSize, wmSize);
          }
        } catch (e) {
          console.log('Watermark note', e);
        }
      }

      // Clean Footer: Left: "Brahmadev Constructions", Right: "Page X of Y"
      doc.setDrawColor(brandGold[0], brandGold[1], brandGold[2]);
      doc.setLineWidth(0.4);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
      doc.text('Brahmadev Constructions', margin, pageHeight - 7);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
    }

    return doc;
  }

  // --- PREVIEW PDF IN MODAL ---
  async previewPDF() {
    if (!this.customerName.trim()) {
      const toast = await this.toastCtrl.create({
        message: 'Please enter customer name to generate preview.',
        duration: 2000,
        position: 'bottom',
        color: 'warning'
      });
      await toast.present();
      return;
    }

    this.isGeneratingPdf = true;

    try {
      const doc = await this.buildPDFDocument();
      this.currentGeneratedDoc = doc;

      if (this.pdfBlobUrl) {
        URL.revokeObjectURL(this.pdfBlobUrl);
      }
      const blob = doc.output('blob');
      this.pdfBlobUrl = URL.createObjectURL(blob);
      this.pdfPreviewSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfBlobUrl);
      this.pdfPages = [];

      this.isDownloadModalOpen = false;
      this.isPreviewModalOpen = true;
      this.isGeneratingPdf = false;

      // Render crisp in-UI page preview for mobile screens & desktop
      await this.renderPdfPages(doc);
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      this.isGeneratingPdf = false;
      const toast = await this.toastCtrl.create({
        message: 'Failed to generate PDF preview.',
        duration: 2500,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
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
          // Scale 1.75 for crisp retina text & numbers on mobile screens
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
    if (this.pdfBlobUrl) {
      URL.revokeObjectURL(this.pdfBlobUrl);
      this.pdfBlobUrl = null;
    }
    this.pdfPreviewSafeUrl = null;
  }

  // --- DOWNLOAD OR SHARE FROM PREVIEW / DIRECT ---
  async downloadCurrentPDF() {
    this.isGeneratingPdf = true;

    try {
      let doc = this.currentGeneratedDoc;
      if (!doc) {
        doc = await this.buildPDFDocument();
        this.currentGeneratedDoc = doc;
      }

      const cleanCustomer = this.customerName.replace(/[^a-zA-Z0-9]/g, '_') || 'Client';
      const fileName = `Brahmadev_Estimate_${cleanCustomer}.pdf`;

      if (Capacitor.isNativePlatform()) {
        const pdfBase64 = doc.output('datauristring').split(',')[1];
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Cache
        });

        await Share.share({
          title: `Brahmadev Construction Estimate - ${this.customerName}`,
          text: `Here is the detailed construction cost estimate for ${this.builtUpArea} sqft building.`,
          url: savedFile.uri,
          dialogTitle: 'Share Construction Estimate PDF'
        });
      } else {
        doc.save(fileName);
      }

      this.isGeneratingPdf = false;
      this.isDownloadModalOpen = false;

      const toast = await this.toastCtrl.create({
        message: 'Quotation PDF downloaded successfully!',
        duration: 2500,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();

    } catch (error) {
      console.error('Error downloading PDF:', error);
      this.isGeneratingPdf = false;
      const toast = await this.toastCtrl.create({
        message: 'Failed to download PDF. Please try again.',
        duration: 2500,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
  }

  // Direct download handler
  async generateAndDownloadPDF() {
    await this.previewPDF();
  }

  resetCalculator() {
    this.plotLength = 30;
    this.plotWidth = 40;
    this.builtUpArea = 1200;
    this.selectedFloors = 1;
    this.selectedPackage = 'standard';
    this.wallType = 'red_brick';
    this.plasterType = 'cement_plaster';
    this.includeInterior = true;
    this.selectedSolarType = 'on_grid';
    this.selectedBatteryType = 'tubular';
    this.selectedSolarPlan = '3kW';
    this.paidAddons.forEach(a => a.selected = false);
    this.packages.forEach(pkg => {
      if (this.defaultPackageRates[pkg.id]) {
        pkg.baseRate = this.defaultPackageRates[pkg.id];
      }
      if (this.defaultInteriorRates[pkg.id]) {
        pkg.interiorRate = this.defaultInteriorRates[pkg.id];
      }
    });
    this.recalculate();
  }

}
