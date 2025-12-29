import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonSpinner, IonIcon } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { Login } from 'src/app/services/login';
import { HttpClient } from '@angular/common/http';
import { addIcons } from 'ionicons'; // Required for registering icons
import { callOutline, lockClosedOutline } from 'ionicons/icons';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonIcon, IonSpinner, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class LoginPage implements OnInit {

  phoneNumber = ''
  password = ''
  showLogin: boolean = false
  isLoading: boolean = false
  constructor(private navCtrl: NavController, private loginService: Login) {
    addIcons({ 
      'call-outline': callOutline, 
      'lock-closed-outline': lockClosedOutline 
    });
    }

  ngOnInit() {
    this.verifyToken()
  }

  login(){
    let params = {
      "phone": this.phoneNumber,
      "password": this.password
    }
    this.isLoading = true
    this.loginService.login(params).subscribe((res:any)=>{
      if(res.token){
        localStorage.setItem('userToken', res.token)
        const decoded: any = jwtDecode(res.token);
        localStorage.setItem('userName', decoded.username)
        this.isLoading = false
        this.navCtrl.navigateRoot('/layout')
      } else {
        this.isLoading = false
        alert('login failed')
      }
      
    }, error => {
      this.isLoading = false
      alert('something went wrong')
    })
  }

  async verifyToken(){
    let token = await localStorage.getItem('userToken')
    if(!token){
      this.showLogin = true
    } else {
      this.loginService.verifyToken({token}).subscribe((res:any)=>{
      if(res.valid == true){
        this.navCtrl.navigateRoot('/layout')
      } else {
        this.showLogin = true
      }
    })
    }
    
  }

}
