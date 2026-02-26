import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule } from '@ionic/angular';
import { Leads } from '../../services/leads';
import { addIcons } from 'ionicons';
import { add, trash } from 'ionicons/icons';

interface Item {
  id: number;
  description: string;
  price: number;
  unit: string;
  gst: number;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-items',
  templateUrl: './items.page.html',
  styleUrls: ['./items.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ItemsPage implements OnInit {

  items: Item[] = [];
  isModalOpen = false;
  editingItem: any = {};

  constructor(private alertController: AlertController, private leads: Leads) {
    addIcons({ add, trash });  
  }

  ngOnInit() {
    this.getItems();
  }

  getItems() {
    this.leads.getItems().subscribe((res: any) => {
      this.items = res;
    });
  }

  openModal(item: Item | null = null) {
    if (item) {
      // Create a copy for editing to avoid modifying the list directly
      this.editingItem = { ...item };
    } else {
      // For a new item, start with an empty object
      this.editingItem = {};
    }
    this.isModalOpen = true;
  }

  async deleteItem(itemToDelete: Item) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete "${itemToDelete.description}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          handler: () => {
            this.leads.deleteItem(itemToDelete.id).subscribe(() => {
              this.getItems();
            });
          }
        }
      ]
    });
    await alert.present();
  }

  saveItem() {
    if (this.editingItem.id) {
      this.leads.updateItem(this.editingItem.id, this.editingItem).subscribe(() => {
        this.isModalOpen = false;
        this.getItems();
      });
    } else {
      this.leads.saveItem(this.editingItem).subscribe(() => {
        this.isModalOpen = false;
        this.getItems();
      });
    }
  }
}