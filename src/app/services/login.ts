import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Login {
  url = 'https://brahmadev-backend.onrender.com'

  constructor(private http: HttpClient){}

  login(params:any){
    return this.http.post(`${this.url}/login`, params)
  }

  verifyToken(params:any){
    return this.http.post(`${this.url}/verify-token`, params)
  }

  addVisit(params:any){
    return this.http.post(`${this.url}/site-details`, params)
  }

  getVisits(params:any){
    return this.http.post(`${this.url}/visits-by-token`, params)
  }

}
