import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'auth_token';
  private roleKey = 'role';
  private permissionsKey = 'permissions';
  private baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) { }

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
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  // ===== Token =====
  getToken(): string | null {
    return localStorage.getItem('token');
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
    return localStorage.getItem('role') || '';
  }

  getRoleFromToken(): string | null {
    const payload = this.decodeToken();
    return payload?.identity?.role || null;
  }

  // ===== Permissions =====
  setPermissions(permissions: string[]) {
    localStorage.setItem(this.permissionsKey, JSON.stringify(permissions));
  }

  getPermissions(): string[] {
    return JSON.parse(localStorage.getItem('permissions') || '[]');
  }

  hasPermission(permission: string): boolean {
    const role = this.getRole().toLowerCase();
    if (role === 'admin') return true;

    const permissions = this.getPermissions().map(p => p.toLowerCase().trim());
    return permissions.includes(permission.toLowerCase().trim());
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
