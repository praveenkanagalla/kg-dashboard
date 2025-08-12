import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'auth_token';
  private roleKey = 'role';
  private permissionsKey = 'permissions';
  private baseUrl = 'http://localhost:5000/api';

  private permissions: string[] = [];

  constructor(private http: HttpClient) {
    // Load permissions from localStorage on service creation
    this.permissions = this.getPermissions();
  }

  // ===== Authentication =====
  register(data: any) {
    return this.http.post(`${this.baseUrl}/register`, data);
  }

  login(data: any) {
    return this.http.post(`${this.baseUrl}/login`, data);
  }

  forgotPassword(email: string) {
    return this.http.post(`${this.baseUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, password: string) {
    return this.http.post(`${this.baseUrl}/reset-password`, { token, password });
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.roleKey);
    localStorage.removeItem(this.permissionsKey);
    this.permissions = [];
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  // ===== Token =====
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
  }

  decodeToken(): any | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch {
      return null;
    }
  }

  // ===== Role =====
  setRole(role: string) {
    localStorage.setItem(this.roleKey, role);
  }

  getRole(): string {
    return localStorage.getItem(this.roleKey) || '';
  }

  getRoleFromToken(): string | null {
    const payload = this.decodeToken();
    return payload?.identity?.role || null;
  }

  // ===== Permissions =====
  setPermissions(permissions: string[]) {
    localStorage.setItem(this.permissionsKey, JSON.stringify(permissions));
    this.permissions = permissions;
  }

  getPermissions(): string[] {
    return JSON.parse(localStorage.getItem(this.permissionsKey) || '[]');
  }

  hasPermission(permission: string): boolean {
    const role = this.getRole().toLowerCase();
    if (role === 'admin') return true; // Admin has all permissions

    const permissions = this.getPermissions().map(p => p.toLowerCase().trim());
    return permissions.includes(permission.toLowerCase().trim());
  }

  // ===== Role Dashboard Mapping =====
  getRoleDashboard(): string {
    const role = this.getRole().toLowerCase();
    const map: { [key: string]: string } = {
      admin: 'admin-dashboard',
      manager: 'manager-dashboard',
      user: 'user-dashboard'
    };
    return map[role] || 'default-dashboard';
  }

  // ===== Combined User Data Save =====
  setUserData(token: string, role: string, permissions: string[]) {
    this.setToken(token);
    this.setRole(role);
    this.setPermissions(permissions);
  }

  // ===== API Requests with Token =====
  getData(endpoint: string): Observable<any> {
    const token = this.getToken();
    const headers = token
      ? new HttpHeaders().set('Authorization', `Bearer ${token}`)
      : new HttpHeaders();
    return this.http.get(`${this.baseUrl}/${endpoint}`, { headers });
  }
}
