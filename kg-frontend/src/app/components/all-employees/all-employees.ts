import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth';

interface User {
  id: number;
  name: string;
  email?: string;
  role?: string;
  phone?: string;
  permissions?: string[];
  pan?: string;
}

@Component({
  selector: 'app-all-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './all-employees.html',
  styleUrls: ['./all-employees.css']
})
export class AllEmployees implements OnInit {
  allUsers: User[] = [];
  filteredUsers: User[] = [];
  searchTerm: string = '';

  loading = false;
  error: string | null = null;

  // View modal
  selectedUser: User | null = null;
  showModalView = false;

  // Edit modal
  showModalEdit = false;
  editUserData: any = {};
  selectedEditPermissions: string[] = [];

  // Permissions
  dropdownOpen = false;
  roles = ['Owner', 'User', 'ManagerCLK', 'ManagerLB', 'ManagerKP', 'Admin'];

  allPermissions = [
    { name: 'Settings', route: 'view_settings' },
    { name: 'Settlement Report', route: 'view_settlement_report_table' },
    { name: 'All Users', route: 'view_all_users' },
    { name: 'Add New Asset', route: 'view_add_new_asset' },
    { name: 'Asset Assign to Employee', route: 'view_asset_assign_to_employee' }
  ];

  // Reactive form for permissions
  userForm: FormGroup;

  constructor(
    private http: HttpClient,
    public auth: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      permissions: [[]]
    });
  }

  ngOnInit(): void {
    this.fetchAllUsers();
  }

  openAddNewEmployee() {
    this.router.navigate(['/', this.auth.getRoleDashboard(), 'add-new-employee']);
  }

  fetchAllUsers(): void {
    this.loading = true;
    this.http.get<User[]>(`http://localhost:5000/api/users`).subscribe({
      next: (res) => {
        this.allUsers = res;
        this.filteredUsers = res;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load users';
        this.loading = false;
      }
    });
  }

  filterUsers() {
    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.allUsers.filter(u =>
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.role?.toLowerCase().includes(term)
    );
  }

  // -------- View Modal --------
  openModalView(user: User) {
    this.selectedUser = user;
    this.userForm.patchValue({ permissions: user.permissions || [] });
    this.showModalView = true;
  }

  closeModalView() {
    this.showModalView = false;
    this.selectedUser = null;
    this.dropdownOpen = false;
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectedPermissionsLabel(): string {
    const selectedRoutes: string[] = this.userForm.get('permissions')?.value || [];
    if (selectedRoutes.length === 0) return 'Select Permissions';
    if (selectedRoutes.length === this.allPermissions.length) return 'All Permissions';

    return selectedRoutes
      .map(route => {
        const perm = this.allPermissions.find(p => p.route === route);
        return perm ? perm.name : route;
      })
      .join(', ');
  }

  onAccessChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const current: string[] = this.userForm.get('permissions')?.value || [];
    if (checkbox.checked) {
      if (!current.includes(checkbox.value)) current.push(checkbox.value);
    } else {
      const index = current.indexOf(checkbox.value);
      if (index > -1) current.splice(index, 1);
    }
    this.userForm.patchValue({ permissions: current });
  }

  // -------- Edit Modal --------
  openModalEdit(user: User) {
    this.editUserData = { ...user };
    this.selectedEditPermissions = user.permissions || [];
    this.showModalEdit = true;
  }

  closeModalEdit() {
    this.showModalEdit = false;
    this.editUserData = {};
    this.selectedEditPermissions = [];
  }

  toggleEditPermission(route: string, checked: boolean) {
    if (checked) {
      if (!this.selectedEditPermissions.includes(route)) {
        this.selectedEditPermissions.push(route);
      }
    } else {
      this.selectedEditPermissions = this.selectedEditPermissions.filter(p => p !== route);
    }
  }

  updateUser() {
    const updatedUser = {
      ...this.editUserData,
      permissions: this.selectedEditPermissions
    };

    this.http.put(`http://localhost:5000/api/update_user/${updatedUser.id}`, updatedUser)
      .subscribe({
        next: () => {
          alert('User updated successfully!');
          this.closeModalEdit();
          this.fetchAllUsers();
        },
        error: () => alert('Failed to update user')
      });
  }
}
