import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { HttpClient, httpResource } from '@angular/common/http';
import { Login } from 'src/app/services/login';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class HistoryPage implements OnInit {
pastVisits: any = []
titlecase: any;
  constructor(private navCtrl: NavController, private loginService: Login, private http: HttpClient) { }

  ngOnInit() {
    this.getVisits()
  }

  back(){
    this.navCtrl.back()
  }

  async getVisits(){
    const token = await localStorage.getItem('userToken')
    this.loginService.getVisits({token}).subscribe((res:any) => {
      this.pastVisits = res.user_visits.reverse()
    })
  }

}
