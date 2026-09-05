import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule } from '@ionic/angular';
import { Leads } from '../../services/leads';
import { addIcons } from 'ionicons';
import { add, arrowBackOutline, trash, trashOutline, cubeOutline } from 'ionicons/icons';
import { NavController } from '@ionic/angular';

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
  isLoading = true;
  isSaving = false;
  isModalOpen = false;
  editingItem: any = {};

  constructor(private alertController: AlertController, private leads: Leads, private navCtrl: NavController) {
    addIcons({ add, trash, trashOutline, arrowBackOutline, cubeOutline });  
  }

  ngOnInit() {
    this.getItems();
  }

  getItems() {
    this.isLoading = true;
    this.leads.getItems().subscribe({
      next: (res: any) => {
        this.items = res || [];
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error fetching items:', err);
        this.isLoading = false;
      }
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
            this.isLoading = true;
            this.leads.deleteItem(itemToDelete.id).subscribe({
              next: () => {
                this.getItems();
              },
              error: (err: any) => {
                console.error('Error deleting item:', err);
                this.isLoading = false;
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  saveItem() {
    if (this.isSaving) return;
    this.isSaving = true;
    if (this.editingItem.id) {
      this.leads.updateItem(this.editingItem.id, this.editingItem).subscribe({
        next: () => {
          this.isSaving = false;
          this.isModalOpen = false;
          this.getItems();
        },
        error: (err: any) => {
          console.error('Error updating item:', err);
          this.isSaving = false;
        }
      });
    } else {
      this.leads.saveItem(this.editingItem).subscribe({
        next: () => {
          this.isSaving = false;
          this.isModalOpen = false;
          this.getItems();
        },
        error: (err: any) => {
          console.error('Error saving item:', err);
          this.isSaving = false;
        }
      });
    }
  }

  back() {
    this.navCtrl.back();
    }

}