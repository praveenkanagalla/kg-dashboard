import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule, HttpClientModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements OnInit {
  private http = inject(HttpClient);

  role = '';
  allowedComponents: string[] = [];

  allComponents = [
    { name: 'Create User', route: 'create-new-user' }
  ];

  ngOnInit() {
    this.role = localStorage.getItem('role') || '';

    if (this.role.toLowerCase() === 'admin') {
      this.allowedComponents = this.allComponents.map(c => c.route);
    } else {
      this.http.get<any>('http://localhost:5000/api/users').subscribe({
        next: (res) => {
          const user = res?.user || {};
          const allowedPermissionRoutes: string[] = user.permissions || [];

          // Convert route-based permissions to component routes
          this.allowedComponents = this.getAllowedComponentRoutesFromRoutes(allowedPermissionRoutes);
        },
        error: (err) => {
          console.error('Failed to fetch user permissions:', err);
          this.allowedComponents = [];
        }
      });
    }
  }

  // Converts route-based permissions (from DB) to sidebar route list
  getAllowedComponentRoutesFromRoutes(permissionRoutes: string[]): string[] {
    return this.allComponents
      .filter(c => permissionRoutes.includes(c.route))
      .map(c => c.route);
  }
}
