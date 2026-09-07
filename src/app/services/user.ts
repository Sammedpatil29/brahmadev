import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { jwtDecode } from 'jwt-decode';

export interface UserItem {
  id?: number;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'user' | string;
  password?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private url = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('userToken') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getUsers(): Observable<UserItem[]> {
    return this.http.get<UserItem[]>(`${this.url}/users`, { headers: this.getAuthHeaders() });
  }

  createUser(userData: Partial<UserItem>): Observable<UserItem> {
    return this.http.post<UserItem>(`${this.url}/users`, userData, { headers: this.getAuthHeaders() });
  }

  updateUser(id: number | string, userData: Partial<UserItem>): Observable<UserItem> {
    return this.http.put<UserItem>(`${this.url}/users/${id}`, userData, { headers: this.getAuthHeaders() });
  }

  deleteUser(id: number | string): Observable<{ message: string; id: any }> {
    return this.http.delete<{ message: string; id: any }>(`${this.url}/users/${id}`, { headers: this.getAuthHeaders() });
  }

  verifyToken(token: string): Observable<{ valid: boolean; user?: UserItem }> {
    return this.http.post<{ valid: boolean; user?: UserItem }>(`${this.url}/verify-token`, { token });
  }

  getCurrentUserRole(): string {
    const storedRole = localStorage.getItem('userRole');
    if (storedRole) {
      return storedRole.toLowerCase();
    }

    const token = localStorage.getItem('userToken');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        if (decoded?.role) {
          localStorage.setItem('userRole', decoded.role);
          return decoded.role.toLowerCase();
        }
      } catch (e) {
        // invalid token format
      }
    }
    return '';
  }

  isAdmin(): boolean {
    return this.getCurrentUserRole() === 'admin';
  }
}

