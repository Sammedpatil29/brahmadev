import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonBadge } from '@ionic/angular/standalone';
import { NavController, ToastController } from '@ionic/angular';
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
  businessOutline
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

@Component({
  selector: 'app-fixed-cost-calculator',
  templateUrl: './fixed-cost-calculator.page.html',
  styleUrls: ['./fixed-cost-calculator.page.scss'],
  standalone: true,
  imports: [IonBadge, IonCardTitle, IonCardHeader, IonCardContent, IonCard, IonButtons, IonButton, IonIcon, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
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

  increaseArea() {
    this.builtUpArea = (this.builtUpArea || 0) + 100;
    this.recalculate();
  }

  decreaseArea() {
    this.builtUpArea = Math.max(100, (this.builtUpArea || 0) - 100);
    this.recalculate();
  }

  activeTab: 'categories' | 'materials' = 'categories';

  // Available Packages
  packages: PackageTier[] = [
    {
      id: 'basic',
      name: 'Economy',
      badge: 'Budget Friendly',
      description: 'Standard TMT steel, 53 grade cement, ceramic tiles, standard fittings.',
      baseRate: 1550,
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
    private toastCtrl: ToastController
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
      businessOutline
    });
  }

  ngOnInit() {
    this.recalculate();
  }

  back() { this.navCtrl.back(); }

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

    // Base percentages of construction cost:
    // 1. Civil & Structure: 38%
    // 2. Centring & Shuttering: 12%
    // 3. Finishing & Plastering: 18%
    // 4. Plumbing & Sanitary: 10%
    // 5. Electrification: 9%
    // 6. Interiors & Woodwork: 13% (if enabled)
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
    this.totalCost = Math.round(this.totalAreaCalculated * this.ratePerSqft);

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
        totalCost: Math.round(this.totalCost * (weights.civil / totalWeight)),
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
        totalCost: Math.round(this.totalCost * (weights.centring / totalWeight)),
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
        totalCost: Math.round(this.totalCost * (weights.finishing / totalWeight)),
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
        totalCost: Math.round(this.totalCost * (weights.plumbing / totalWeight)),
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
        totalCost: Math.round(this.totalCost * (weights.electrical / totalWeight)),
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
        totalCost: Math.round(this.totalCost * (weights.interior / totalWeight)),
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

    // Material Estimations (standard thumb rules per sqft)
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

  async copyEstimate() {
    const pkg = this.packages.find(p => p.id === this.selectedPackage);
    let text = `🏗️ *BRAHMADEV CONSTRUCTIONS - BUILDING ESTIMATE*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📐 *Built-up Area:* ${this.builtUpArea} sq.ft (${this.getFloorsLabel()})\n`;
    text += `📦 *Package:* ${pkg?.name} (${pkg?.badge})\n`;
    text += `💰 *Rate:* ₹${this.ratePerSqft.toLocaleString('en-IN')}/sq.ft\n`;
    text += `🏷️ *Total Estimated Cost:* ₹${this.totalCost.toLocaleString('en-IN')}\n\n`;
    text += `📊 *CATEGORY BREAKDOWN:*\n`;

    this.categories.forEach((c, index) => {
      text += `${index + 1}. *${c.name}* (${c.percentage}%)\n   ↳ ₹${c.totalCost.toLocaleString('en-IN')} (₹${c.ratePerSqft}/sq.ft)\n`;
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

  resetCalculator() {
    this.builtUpArea = 1200;
    this.selectedFloors = 1;
    this.selectedPackage = 'standard';
    this.wallType = 'red_brick';
    this.plasterType = 'gypsum';
    this.includeInterior = true;
    this.recalculate();
  }

}
