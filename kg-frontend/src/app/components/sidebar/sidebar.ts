import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from '../../service/auth';

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

  allPermissions = [
    { name: 'Create User', route: 'view_create_new_user' },
    { name: 'Create New Employee', route: 'view_new_employee' },
    { name: 'Settings', route: 'view_settings' }
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
        // Use your AuthService decodeToken method or fallback to localStorage role
        const decoded: any = (this.auth as any).decodeToken ? (this.auth as any).decodeToken(token) : null;
        this.role = decoded?.role || this.auth.getRole();
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
    const allowed = this.auth.hasPermission(permission);
    return allowed;
  }

  getCreateUserLink(): string[] {
    return ['/', this.auth.getRoleDashboard(), 'create-new-user'];
  }

  getNEwEmployeeLink(): string[] {
    return ['/', this.auth.getRoleDashboard(), 'new-employee'];
  }

  getSettingsLink(): string[] {
    return ['/', this.auth.getRoleDashboard(), 'settings'];
  }
}
