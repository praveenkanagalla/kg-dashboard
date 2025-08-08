import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule, HttpClientModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class Sidebar implements OnInit {
  users: any[] = [];
  loading = false;
  error = '';

  // Master permission list - add all your app routes/components here
  allPermissions = [
    { name: 'Create User', route: 'create-new-user' },
    { name: 'Employee List', route: 'employee-list' },
    { name: 'Reports', route: 'reports' },
    { name: 'Settings', route: 'settings' }
  ];

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadUsers();
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
              ? this.allPermissions.map(p => p.route) // Admin gets all permissions
              : Array.isArray(user.permissions)
                ? Array.from(new Set(user.permissions)) // Ensure unique permissions
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
}
