import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:5000/api';

  private tokenKey = 'auth_token';
  private roleKey = 'role';
  private permissionsKey = 'permissions';

  constructor(private http: HttpClient) { }

  // ===== API Calls =====
  register(data: any) {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  login(credentials: { email: string; password: string }) {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  forgotPassword(email: string) {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, password: string) {
    return this.http.post(`${this.apiUrl}/reset-password`, { token, password });
  }

  getData(endpoint: string): Observable<any> {
    const token = this.getToken();
    const headers = token
      ? new HttpHeaders().set('Authorization', `Bearer ${token}`)
      : new HttpHeaders();
    return this.http.get(`${this.apiUrl}/${endpoint}`, { headers });
  }

  // ===== Local Storage =====
  saveUserData(res: any) {
    this.setToken(res.token);
    this.setRole(res.role);
    localStorage.setItem('name', res.name);
    localStorage.setItem('email', res.email);
    this.setPermissions(res.permissions || []);
    localStorage.setItem('permissions', JSON.stringify(res.permissions));
  }

  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setRole(role: string) {
    localStorage.setItem(this.roleKey, role);
  }

  getRole(): string {
    return localStorage.getItem(this.roleKey) || '';
  }

  setPermissions(permissions: string[]) {
    localStorage.setItem(this.permissionsKey, JSON.stringify(permissions));
  }

  getPermissions(): string[] {
    return JSON.parse(localStorage.getItem(this.permissionsKey) || '[]');
  }

  hasPermission(permission: string): boolean {
    const role = this.getRole().toLowerCase();
    if (role === 'admin') return true; // Admin sees everything
    return this.getPermissions().map(p => p.toLowerCase().trim())
      .includes(permission.toLowerCase().trim());
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout() {
    localStorage.clear();
  }

  // ===== Optional: Decode JWT =====
  decodeToken(): any | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }

  // ===== Dashboard Routing by Role =====
  getRoleDashboard(): string {
    const role = this.getRole().toLowerCase();
    const map: { [key: string]: string } = {
      admin: 'admin-dashboard',
      manager: 'manager-dashboard',
      user: 'user-dashboard'
    };
    return map[role] || 'default-dashboard';
  }
}
