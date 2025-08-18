import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  permissions?: string[];
  blood_group?: string;
  address?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = 'http://localhost:5000';

  constructor(private http: HttpClient) { }

  // Get all users
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/get_users`);
  }

  // Get single user
  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/api/users/${id}`);
  }

  // Create new user
  createUser(user: User): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/api/users`, user);
  }

  // Login
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/login`, { email, password });
  }

  // Reset password
  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/reset-password`, { token, password });
  }

  // Forgot password
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/forgot-password`, { email });
  }

  // Add/update permissions
  savePermissions(userId: number, permissions: string[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/permissions`, { user_id: userId, permissions });
  }
}
