import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Leads {
  url: any = 'https://brahmadev-backend.onrender.com'
 constructor(private http: HttpClient){}

 getLeads(){
  return this.http.get(`${this.url}/leads`)
 }

updateLead(id: number, data: any){
    return this.http.patch(`${this.url}/${id}`, data);
  }
}
