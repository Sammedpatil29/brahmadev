import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonContent,
  IonIcon,
  IonSpinner,
  IonSearchbar,
  IonModal,
  IonCard,
  IonCardContent,
  IonBadge,
  IonFab,
  IonFabButton,
  IonRefresher,
  IonRefresherContent,
  IonInput,
  IonLabel,
  IonSegment,
  IonSegmentButton
} from '@ionic/angular/standalone';
import { NavController, ToastController, AlertController } from '@ionic/angular';
import { UserService, UserItem } from 'src/app/services/user';
import { addIcons } from 'ionicons';
import {
  personOutline,
  personAddOutline,
  createOutline,
  trashOutline,
  callOutline,
  mailOutline,
  shieldCheckmarkOutline,
  arrowBackOutline,
  searchOutline,
  refreshOutline,
  eyeOutline,
  eyeOffOutline,
  closeOutline,
  peopleOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  timeOutline,
  add,
  lockClosedOutline
} from 'ionicons/icons';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-manage-users',
  templateUrl: './manage-users.page.html',
  styleUrls: ['./manage-users.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonTitle,
    IonContent,
    IonIcon,
    IonSpinner,
    IonSearchbar,
    IonModal,
    IonCard,
    IonCardContent,
    IonBadge,
    IonFab,
    IonFabButton,
    IonRefresher,
    IonRefresherContent,
    IonInput,
    IonLabel,
    IonSegment,
    IonSegmentButton
  ]
})
export class ManageUsersPage implements OnInit {
  users: UserItem[] = [];
  filteredUsers: UserItem[] = [];
  searchTerm: string = '';
  selectedRoleFilter: string = 'all';

  isLoading: boolean = false;
  isSaving: boolean = false;
  isModalOpen: boolean = false;
  isEditing: boolean = false;
  isPasswordVisible: boolean = false;

  currentUserId: any = null;
  currentUserRole: string = '';

  editingUser: Partial<UserItem> = {
    name: '',
    email: '',
    phone: '',
    role: 'user',
    password: ''
  };

  totalCount: number = 0;
  adminCount: number = 0;
  staffCount: number = 0;

  constructor(
    private navCtrl: NavController,
    private userService: UserService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({arrowBackOutline,callOutline,mailOutline,timeOutline,createOutline,trashOutline,add,closeOutline,personOutline,shieldCheckmarkOutline,lockClosedOutline,personAddOutline,searchOutline,refreshOutline,eyeOutline,eyeOffOutline,peopleOutline,checkmarkCircleOutline,alertCircleOutline});
  }

  ngOnInit() {
    this.extractCurrentUserInfo();
    this.loadUsers();
  }

  ionViewDidEnter() {
    this.extractCurrentUserInfo();
    this.loadUsers();
  }

  extractCurrentUserInfo() {
    const token = localStorage.getItem('userToken');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        this.currentUserId = decoded?.id;
        this.currentUserRole = decoded?.role || localStorage.getItem('userRole') || '';
      } catch (e) {
        // ignore
      }
    }
  }

  goBack() {
    this.navCtrl.navigateBack('/layout/home');
  }

  loadUsers(event?: any) {
    if (!event) this.isLoading = true;

    this.userService.getUsers().subscribe({
      next: (data: UserItem[]) => {
        this.users = Array.isArray(data) ? data : [];
        this.calculateCounts();
        this.applyFilter();
        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: async (err: any) => {
        this.isLoading = false;
        if (event) event.target.complete();
        this.showToast(err?.error?.error || 'Failed to load users', 'danger');
      }
    });
  }

  calculateCounts() {
    this.totalCount = this.users.length;
    this.adminCount = this.users.filter(u => (u.role || '').toLowerCase() === 'admin').length;
    this.staffCount = this.users.filter(u => (u.role || '').toLowerCase() !== 'admin').length;
  }

  applyFilter() {
    const term = (this.searchTerm || '').trim().toLowerCase();
    this.filteredUsers = this.users.filter(user => {
      const matchRole =
        this.selectedRoleFilter === 'all' ||
        (user.role || '').toLowerCase() === this.selectedRoleFilter;

      if (!matchRole) return false;

      if (!term) return true;

      const nameMatch = (user.name || '').toLowerCase().includes(term);
      const emailMatch = (user.email || '').toLowerCase().includes(term);
      const phoneMatch = (user.phone || '').toLowerCase().includes(term);
      const roleMatch = (user.role || '').toLowerCase().includes(term);

      return nameMatch || emailMatch || phoneMatch || roleMatch;
    });
  }

  onSearchChange(event: any) {
    this.searchTerm = event?.detail?.value || '';
    this.applyFilter();
  }

  setRoleFilter(filter: string) {
    this.selectedRoleFilter = filter;
    this.applyFilter();
  }

  resetSearch() {
    this.searchTerm = '';
    this.selectedRoleFilter = 'all';
    this.applyFilter();
  }

  openAddModal() {
    this.isEditing = false;
    this.isPasswordVisible = false;
    this.editingUser = {
      name: '',
      email: '',
      phone: '',
      role: 'user',
      password: ''
    };
    this.isModalOpen = true;
  }

  openEditModal(user: UserItem) {
    this.isEditing = true;
    this.isPasswordVisible = false;
    this.editingUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role || 'user',
      password: '' // empty means keep existing
    };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  async saveUser() {
    const name = (this.editingUser.name || '').trim();
    const email = (this.editingUser.email || '').trim().toLowerCase();
    const phone = (this.editingUser.phone || '').trim();
    const role = (this.editingUser.role || 'user').trim().toLowerCase();
    const password = (this.editingUser.password || '').trim();

    if (!name) {
      this.showToast('Please enter the user’s full name', 'warning');
      return;
    }
    if (!phone || phone.length < 10) {
      this.showToast('Please enter a valid 10-digit phone number', 'warning');
      return;
    }
    if (!email || !email.includes('@') || !email.includes('.')) {
      this.showToast('Please enter a valid email address', 'warning');
      return;
    }
    if (!this.isEditing && (!password || password.length < 4)) {
      this.showToast('Password is required (minimum 4 characters)', 'warning');
      return;
    }

    const payload: Partial<UserItem> = {
      name,
      email,
      phone,
      role
    };

    if (password) {
      payload.password = password;
    }

    this.isSaving = true;

    if (this.isEditing && this.editingUser.id) {
      this.userService.updateUser(this.editingUser.id, payload).subscribe({
        next: (res: UserItem) => {
          this.isSaving = false;
          this.isModalOpen = false;
          this.showToast(`User "${res.name}" updated successfully`, 'success');
          this.loadUsers();
        },
        error: (err: any) => {
          this.isSaving = false;
          this.showToast(err?.error?.error || 'Failed to update user', 'danger');
        }
      });
    } else {
      this.userService.createUser(payload).subscribe({
        next: (res: UserItem) => {
          this.isSaving = false;
          this.isModalOpen = false;
          this.showToast(`User "${res.name}" created successfully`, 'success');
          this.loadUsers();
        },
        error: (err: any) => {
          this.isSaving = false;
          this.showToast(err?.error?.error || 'Failed to create user', 'danger');
        }
      });
    }
  }

  async confirmDelete(user: UserItem) {
    if (this.currentUserId && Number(user.id) === Number(this.currentUserId)) {
      this.showToast('You cannot delete your own account while logged in.', 'warning');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Delete User',
      subHeader: user.name,
      message: `Are you sure you want to delete ${user.name} (${user.role})? This action cannot be undone.`,
      mode: 'ios',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.deleteUser(user);
          }
        }
      ]
    });

    await alert.present();
  }

  deleteUser(user: UserItem) {
    if (!user.id) return;
    this.isLoading = true;
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.isLoading = false;
        this.showToast(`User "${user.name}" deleted`, 'success');
        this.loadUsers();
      },
      error: (err: any) => {
        this.isLoading = false;
        this.showToast(err?.error?.error || 'Failed to delete user', 'danger');
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning' | 'primary' = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      color,
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
  }
}
