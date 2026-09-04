import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Leads {
  url: any = 'http://localhost:3000'
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

  saveInvoice(params:any){
    return this.http.post(`${this.url}/invoices`, params);
  }

  createQuote(params:any){
    return this.http.post(`${this.url}/quotations`, params);
  }

  getQuotations(){
    return this.http.get(`${this.url}/quotations`);
  }

  deleteQuotation(id:any){
    return this.http.delete(`${this.url}/quotations/${id}`)
  }

  getMetaAdSpend(datePreset: string = 'this_month', since?: string, until?: string) {
    let params: any = { date_preset: datePreset };
    if (since && until) {
      params = { since, until };
    }
    return this.http.get(`${this.url}/meta/ad-spend`, { params });
  }

  getMetaAdAccountStatus() {
    return this.http.get(`${this.url}/meta/ad-account-status`);
  }
}

