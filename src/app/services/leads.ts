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

 updateLeads(params:any, id:any){
  return this.http.patch(`${this.url}/leads/${id}`, params)
 }

updateLead(id: number, data: any){
    return this.http.patch(`${this.url}/${id}`, data);
  }

getLeadDetails(id: number){
    return this.http.get(`${this.url}/leads/${id}`);
  }

  getLeadCountNew(){
     return this.http.get(`${this.url}/leads/count/new`);
  }
}
