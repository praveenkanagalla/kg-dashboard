import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
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
    { name: 'Settings', route: 'view_settings' },
    { name: 'Settlement-report-table', route: 'view_Settlement_report_table' },
    { name: 'all-employees', route: 'view_all_employees' },
    { name: 'add-new-asset', route: 'view_add_new_asset' },
    { name: 'asset-assign-to-employee', route: 'view_asset_assign_to_employee' }
  ];

  constructor(private http: HttpClient, public auth: AuthService, private router: Router) { }

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

  getSettingsLink(): string[] {
    return ['/', this.auth.getRoleDashboard(), 'settings'];
  }

  getAllUsersLink(): string[] {
    return ['/', this.auth.getRoleDashboard(), 'all-employees'];
  }

  getSettlementReportTableLink(): string[] {
    return ['/', this.auth.getRoleDashboard(), 'Settlement-report-table'];
  }

  getAddNewAssetLink(): string[] {
    return ['/', this.auth.getRoleDashboard(), 'add-new-asset'];
  }

  getAssetAssignToEmployeeLink(): string[] {
    return ['/', this.auth.getRoleDashboard(), 'asset-assign-to-employee'];
  }

  // dropdown code
  isStoreDropdownOpen = false;
  isAssetAndAssignDropdownOpen = false;

  toggleStoreDropdown() {
    this.isStoreDropdownOpen = !this.isStoreDropdownOpen;
  }

  toggleAssetAndAssignDropdown() {
    this.isAssetAndAssignDropdownOpen = !this.isAssetAndAssignDropdownOpen;
  }

  // Detect clicks outside dropdown
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.isStoreDropdownOpen = false;
    }
  }

}
