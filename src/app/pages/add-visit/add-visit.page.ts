import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { IonInput } from '@ionic/angular/standalone';
import { IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Login } from 'src/app/services/login';


@Component({
  selector: 'app-add-visit',
  templateUrl: './add-visit.page.html',
  styleUrls: ['./add-visit.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonSelectOption, IonSelect, IonToolbar, CommonModule, FormsModule, IonInput]
})
export class AddVisitPage implements OnInit {

capturedImage: any = [];
capturedSelfie: any;

latitude: number | null = null;
  longitude: number | null = null;

  locationMessage = ''

ownerName: any;
ownerContact: any;
builtUpArea: any;
floors: any;
engineerName: any;
engineerContact: any;
contractorName: any;
contractorContact: any;
comments: any;
location:any;
response:any;
isGettingLocation: boolean = false
isLoading: boolean = false

  constructor(private navCtrl: NavController, private loginService: Login) { }

  ngOnInit() {
    this.getCurrentLocation()
  }

  back(){
    this.navCtrl.back()
  }

  async submit(){
    if(!this.latitude){
      alert('enable location')
      return
    }
    this.isLoading = true
    let token = await localStorage.getItem('userToken')
    let params = {
      "token": token,
      "ownerName": this.ownerName,
      "ownerContact": this.ownerContact,
      "builtUpArea": this.builtUpArea,
      "floors": this.floors,
      "engineerName": this.engineerName,
      "engineerContact": this.engineerContact,
      "contractorName": this.contractorName,
      "contractorContact": this.contractorContact,
      "comments": this.comments,
      "lat": this.latitude,
      "lng": this.longitude,
      "response": this.response,
      "locationImage": this.capturedImage,
      "selfie": this.capturedSelfie
    }
    this.loginService.addVisit(params).subscribe((res:any)=>{
      
      alert('Visit added successfully')
      this.isLoading = false
      this.navCtrl.navigateRoot('/layout/home')
    }, error => {
      alert('Failed to submit visit')
      this.isLoading = false
    })
    
    
  }

  async openCamera(type:any) {
    try {
      const image = await Camera.getPhoto({
        quality: 40,
        allowEditing: false,
        resultType: CameraResultType.DataUrl, // You can also use Uri if you want file path
        source: CameraSource.Camera,
        saveToGallery: false
      });

      if(type == 'location'){
        if(this.capturedImage.length != 4){
          this.capturedImage.push(image.dataUrl)
        } else {
          alert('max 4 images allowed')
        }
      } else {
        this.capturedSelfie = image.dataUrl;
      }
    } catch (error) {
      console.error('Camera error:', error);
    }
  }

  async getCurrentLocation() {
    try {
      // Check permission first
      this.isGettingLocation = true
      const permStatus = await Geolocation.checkPermissions();

      if (permStatus.location !== 'granted') {
        const request = await Geolocation.requestPermissions();
        if (request.location !== 'granted') {
          return alert(
            'Permission Denied'
          );
        }
        this.isGettingLocation = false
      }

      // Get the current location
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 20000
      });

      this.latitude = coordinates.coords.latitude;
      this.longitude = coordinates.coords.longitude;
      this.isGettingLocation = false
      console.log(
        'Location Acquired'
      );
      this.locationMessage = 'Location Acquired'
    } catch (error: any) {
      this.isGettingLocation = false
      console.error('Error getting location:', error);

      // Handle different error types
      if (error.message.includes('timeout')) {
        this.locationMessage = 'Location request timed out. Try again.';
      } else if (error.message.includes('denied')) {
        this.locationMessage = 'Please enable location permission in settings.';
      } else {
        this.locationMessage = 'Unable to get your location. Please check GPS and try again.';
      }
    }
  }

  deleteLocationImage(index:any){
    this.capturedImage.splice(index, 1);
  }

}
