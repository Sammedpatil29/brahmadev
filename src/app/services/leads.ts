import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Leads {
  url: any = 'https://brahmadev-backend.onrender.com'
 constructor(private http: HttpClient){}

 getLeads(){
  let token = localStorage.getItem('userToken')
  console.log(token)
  let headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  })
  return this.http.get(`${this.url}/leads`, {headers: headers})
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
    let token = localStorage.getItem('userToken')
  console.log(token)
  let headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  })
     return this.http.get(`${this.url}/leads/count/new`, {headers: headers});
  }

  saveLead(params:any){
    return this.http.post(`${this.url}/meta-leads`, params)
  }

  getItems(){
    return this.http.get(`${this.url}/items`);
  }

  saveItem(params:any){
    return this.http.post(`${this.url}/items`, params);
  }

  updateItem(id:any, params:any){
    return this.http.patch(`${this.url}/items/${id}`, params);
  }

  deleteItem(id:any){
    return this.http.delete(`${this.url}/items/${id}`);
  }
}
