import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from '../../service/auth'; // import AuthService

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class Sidebar implements OnInit {
  users: any[] = [];
  loading = false;
  error = '';

  role: string = '';
  roleDashboard: string = '';

  // Master permission list - add all your app routes/components here
  allPermissions = [
    { name: 'Create User', route: 'create-new-user' },
    { name: 'Settings', route: 'settings' }
  ];

  constructor(private http: HttpClient, public auth: AuthService) { }

  ngOnInit(): void {
    this.setRoleFromToken();
    this.loadUsers();
  }

  setRoleFromToken() {
    const token = this.auth.getToken();
    if (token) {
      try {
        const decoded: any = (this.auth as any).decodeToken(token);
        this.role = decoded.role || '';
        this.roleDashboard = this.role.toLowerCase() + '-dashboard';
      } catch {
        this.role = '';
        this.roleDashboard = '';
      }
    }
  }

  loadUsers() {
    this.loading = true;
    this.error = '';

    this.http.get<any[]>(`${environment.apiUrl}/get_users`).subscribe({
      next: (data) => {
        this.users = (data || []).map(user => {
          const isAdmin = user.role?.toLowerCase() === 'admin';
          return {
            ...user,
            permissions: isAdmin
              ? this.allPermissions.map(p => p.route)
              : Array.isArray(user.permissions)
                ? Array.from(new Set(user.permissions))
                : []
          };
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to fetch users: ' + (err.message || err);
        this.loading = false;
      }
    });
  }
  hasPermission(permission: string): boolean {
    const role = this.auth.getRole().toLowerCase();
    console.log('Checking permission:', permission, 'for role:', role);
    if (role === 'admin') {
      console.log('Admin detected, allowing all.');
      return true;
    }
    const allowed = this.auth.hasPermission(permission);
    console.log('Allowed?', allowed);
    return allowed;
  }
}
