import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
  IonBadge,
  IonModal,
  IonSpinner
} from '@ionic/angular/standalone';
import { NavController, ToastController } from '@ionic/angular';
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
  wifiOutline
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

@Component({
  selector: 'app-fixed-cost-calculator',
  templateUrl: './fixed-cost-calculator.page.html',
  styleUrls: ['./fixed-cost-calculator.page.scss'],
  standalone: true,
  imports: [
    IonSpinner,
    IonModal,
    IonBadge,
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
  builtUpArea: number = 1200; // in sq.ft
  selectedFloors: number = 1; // 1 = Ground, 2 = G+1, 3 = G+2, 4 = G+3
  selectedPackage: string = 'standard';
  wallType: string = 'red_brick'; // red_brick | aac_block | concrete_block
  plasterType: string = 'gypsum'; // gypsum | cement_plaster
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
      id: '3d_modelling',
      title: '3D Exterior Elevation & Modeling',
      subtitle: 'High-definition photorealistic 3D building visualization',
      description: 'Ultra-realistic 3D exterior views with daylight & night lighting, modern facade treatments, texture proposals, and color palettes.',
      icon: 'cube-outline',
      iconColor: '#9333ea',
      iconBg: '#f3e8ff',
      marketValue: 25000,
      badge: '100% FREE',
      features: [
        'Photorealistic 3D exterior rendering angles',
        'Modern facade cladding & texture proposals',
        'Exterior color scheme & lighting concepts',
        'Compound wall & gate customized 3D design'
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
      title: 'Site Soil Survey & Concrete Cube Testing',
      subtitle: 'Pre-construction verification & compressive strength lab tests',
      description: 'Site ground leveling survey, soil bearing suitability inspection, and mandatory 7-day & 28-day concrete cube compressive strength quality testing.',
      icon: 'sparkles-outline',
      iconColor: '#16a34a',
      iconBg: '#dcfce7',
      marketValue: 10000,
      badge: '100% FREE',
      features: [
        'Site boundary & ground level survey',
        'Soil suitability & excavation depth audit',
        '7-day & 28-day concrete cube compression tests',
        'Cement & aggregate quality check certificates'
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
      title: 'Underground RCC Water Sump (8,000L)',
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
      id: 'compound_wall',
      title: 'Compound Boundary Wall & Main Entrance Gate',
      subtitle: 'Complete property perimeter wall & designer MS gate',
      description: 'Solid masonry boundary wall up to 120 Rft with coping, smooth cement plastering, weatherproof exterior paint, and designer MS main entrance gate.',
      icon: 'business-outline',
      iconColor: '#d97706',
      iconBg: '#fef3c7',
      marketValue: 125000,
      badge: '100% FREE',
      features: [
        '5ft solid masonry boundary wall with coping & plastering',
        'Weatherproof primer & exterior apex paint finish',
        'Designer MS main entrance gate (sliding/swing)',
        'Built-in security wicket pedestrian gate'
      ]
    }
  ];

  totalComplementaryValue: number = 347000;

  // Optional Paid Upgrades & Add-ons
  paidAddons: PaidAddon[] = [
    {
      id: 'solar_power',
      name: 'Solar Rooftop Power System (3kW)',
      tagline: 'Generates ~12-15 units/day, reduces 80%+ electricity bills',
      description: 'Tier-1 high-efficiency Monocrystalline solar panels, on-grid string inverter, elevated galvanized mounting structure, and net-metering synchronization.',
      price: 175000,
      unit: '3kW On-Grid',
      icon: 'flash-outline',
      iconColor: '#f59e0b',
      iconBg: '#fef3c7',
      selected: false,
      features: [
        'Monocrystalline high-efficiency solar PV panels',
        'On-grid string inverter with Wi-Fi monitoring',
        'Bi-directional net metering approval support',
        '25-year panel performance warranty'
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
      name: 'Terrace Waterproofing & Heat Barrier',
      tagline: 'Keeps top floor 4-6°C cooler & 100% leakproof',
      description: '3-layer elastomeric polymer waterproofing membrane topped with high-SRI white solar reflective cooling thermal barrier paint.',
      price: 45000,
      unit: 'Full Terrace',
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
  currentGeneratedDoc: jsPDF | null = null;

  // Available Packages
  packages: PackageTier[] = [
    {
      id: 'basic',
      name: 'Economy',
      badge: 'Budget Friendly',
      description: 'Standard TMT steel, PPC cement, ceramic tiles, standard fittings.',
      baseRate: 1650,
      color: '#6c757d'
    },
    {
      id: 'standard',
      name: 'Standard',
      badge: 'Most Popular',
      description: 'Fe550 steel, branded cement, vitrified tiles, modular switches, premium paint.',
      baseRate: 1850,
      color: '#0d6efd'
    },
    {
      id: 'premium',
      name: 'Premium',
      badge: 'High Quality',
      description: 'Grade A steel, Italian/granite finish, Jaquar/Kohler bath fittings, UPVC windows.',
      baseRate: 2300,
      color: '#198754'
    },
    {
      id: 'luxury',
      name: 'Luxury',
      badge: 'Ultra Modern',
      description: 'Architectural finishes, smart home automation, designer modular kitchen & woodwork.',
      baseRate: 2850,
      color: '#6f42c1'
    }
  ];

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
    private sanitizer: DomSanitizer
  ) {
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
      wifiOutline
    });
  }

  ngOnInit() {
    this.updateTodayDate();
    this.recalculate();
  }

  updateTodayDate() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = now.toLocaleString('en-IN', { month: 'short' });
    const year = now.getFullYear();
    this.todayDateFormatted = `${day} ${month} ${year}`;
  }

  back() { this.navCtrl.back(); }

  increaseArea() {
    this.builtUpArea = (this.builtUpArea || 0) + 100;
    this.recalculate();
  }

  decreaseArea() {
    this.builtUpArea = Math.max(100, (this.builtUpArea || 0) - 100);
    this.recalculate();
  }

  setPresetArea(area: number) {
    this.builtUpArea = area;
    this.recalculate();
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
    let baseRate = pkg.baseRate;

    // Adjust for wall type
    if (this.wallType === 'aac_block') baseRate -= 30;
    if (this.wallType === 'concrete_block') baseRate -= 20;

    // Adjust for plaster type (Gypsum is cost & time effective)
    if (this.plasterType === 'gypsum') baseRate -= 25;

    // Total area considering floors (each floor adds builtup space)
    this.totalAreaCalculated = Math.max(100, (this.builtUpArea || 0) * (this.selectedFloors || 1));

    // Base weights
    let weights = {
      civil: 0.38,
      centring: 0.12,
      finishing: 0.18,
      plumbing: 0.10,
      electrical: 0.09,
      interior: this.includeInterior ? 0.13 : 0
    };

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    this.ratePerSqft = Math.round(baseRate * totalWeight);
    this.baseConstructionCost = Math.round(this.totalAreaCalculated * this.ratePerSqft);
    this.selectedAddonsCost = this.paidAddons.filter(a => a.selected).reduce((sum, a) => sum + a.price, 0);
    this.totalCost = this.baseConstructionCost + this.selectedAddonsCost;

    // Build categories
    this.categories = [
      {
        id: 'civil',
        name: 'Civil & Structure',
        icon: 'construct-outline',
        iconColor: '#d97706',
        iconBg: '#fef3c7',
        percentage: Math.round((weights.civil / totalWeight) * 100),
        ratePerSqft: Math.round(this.ratePerSqft * (weights.civil / totalWeight)),
        totalCost: Math.round(this.baseConstructionCost * (weights.civil / totalWeight)),
        isExpanded: false,
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
        percentage: Math.round((weights.centring / totalWeight) * 100),
        ratePerSqft: Math.round(this.ratePerSqft * (weights.centring / totalWeight)),
        totalCost: Math.round(this.baseConstructionCost * (weights.centring / totalWeight)),
        isExpanded: false,
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
        percentage: Math.round((weights.finishing / totalWeight) * 100),
        ratePerSqft: Math.round(this.ratePerSqft * (weights.finishing / totalWeight)),
        totalCost: Math.round(this.baseConstructionCost * (weights.finishing / totalWeight)),
        isExpanded: false,
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
        percentage: Math.round((weights.plumbing / totalWeight) * 100),
        ratePerSqft: Math.round(this.ratePerSqft * (weights.plumbing / totalWeight)),
        totalCost: Math.round(this.baseConstructionCost * (weights.plumbing / totalWeight)),
        isExpanded: false,
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
        percentage: Math.round((weights.electrical / totalWeight) * 100),
        ratePerSqft: Math.round(this.ratePerSqft * (weights.electrical / totalWeight)),
        totalCost: Math.round(this.baseConstructionCost * (weights.electrical / totalWeight)),
        isExpanded: false,
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
      this.categories.push({
        id: 'interior',
        name: 'Interiors & Woodwork',
        icon: 'home-outline',
        iconColor: '#9333ea',
        iconBg: '#f3e8ff',
        percentage: Math.round((weights.interior / totalWeight) * 100),
        ratePerSqft: Math.round(this.ratePerSqft * (weights.interior / totalWeight)),
        totalCost: Math.round(this.baseConstructionCost * (weights.interior / totalWeight)),
        isExpanded: false,
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

  async copyEstimate() {
    const pkg = this.packages.find(p => p.id === this.selectedPackage);
    let text = `🏗️ *BRAHMADEV CONSTRUCTIONS - BUILDING ESTIMATE*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📐 *Built-up Area:* ${this.builtUpArea} sq.ft (${this.getFloorsLabel()})\n`;
    text += `📦 *Package:* ${pkg?.name} (${pkg?.badge})\n`;
    text += `💰 *Construction Rate:* ₹${this.ratePerSqft.toLocaleString('en-IN')}/sq.ft\n`;
    text += `🏷️ *Base Construction Cost:* ₹${this.baseConstructionCost.toLocaleString('en-IN')}\n`;

    const selectedAddons = this.getSelectedAddons();
    if (selectedAddons.length > 0) {
      text += `\n⚡ *OPTIONAL UPGRADES & PAID ADD-ONS (${selectedAddons.length} Selected):*\n`;
      selectedAddons.forEach((a, idx) => {
        text += `${idx + 1}. *${a.name}* (${a.unit}) - ₹${a.price.toLocaleString('en-IN')}\n`;
      });
      text += `↳ *Add-ons Subtotal:* ₹${this.selectedAddonsCost.toLocaleString('en-IN')}\n`;
      text += `💰 *GRAND TOTAL COST:* ₹${this.totalCost.toLocaleString('en-IN')}\n`;
    } else {
      text += `🏷️ *Total Estimated Cost:* ₹${this.totalCost.toLocaleString('en-IN')}\n`;
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
    doc.text('TOTAL ESTIMATED CONSTRUCTION COST', margin + 6, currentY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(255, 255, 255);
    doc.text(`Rs. ${this.totalCost.toLocaleString('en-IN')}`, margin + 6, currentY + 15);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 200);
    if (this.selectedAddonsCost > 0) {
      doc.text(`(Base: Rs. ${this.baseConstructionCost.toLocaleString('en-IN')} + ${this.getSelectedAddonsCount()} Add-ons: Rs. ${this.selectedAddonsCost.toLocaleString('en-IN')})`, margin + 6, currentY + 20);
    } else {
      doc.text(`(All-inclusive fixed cost estimate)`, margin + 6, currentY + 20);
    }

    // Right Stats inside banner
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(brandGold[0], brandGold[1], brandGold[2]);
    doc.text(`Rs. ${this.ratePerSqft.toLocaleString('en-IN')} / sq.ft`, pageWidth - margin - 6, currentY + 10, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(255, 255, 255);
    doc.text(`${this.builtUpArea} sq.ft Built-up • ${this.getFloorsLabel()}`, pageWidth - margin - 6, currentY + 15, { align: 'right' });
    doc.text(`Masonry: ${this.getWallLabel()} | Plaster: ${this.getPlasterLabel()}`, pageWidth - margin - 6, currentY + 20, { align: 'right' });

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
      '2. Electricity and water required during the construction period to be supplied by the client.',
      '3. Stage-wise payment milestones to be followed as per the mutual construction contract.'
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

      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      this.pdfPreviewSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);

      this.isDownloadModalOpen = false;
      this.isPreviewModalOpen = true;
      this.isGeneratingPdf = false;
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

  closePreviewModal() {
    this.isPreviewModalOpen = false;
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
    this.builtUpArea = 1200;
    this.selectedFloors = 1;
    this.selectedPackage = 'standard';
    this.wallType = 'red_brick';
    this.plasterType = 'gypsum';
    this.includeInterior = true;
    this.paidAddons.forEach(a => a.selected = false);
    this.recalculate();
  }

}
