import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sidebar',
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements OnInit {
  role = '';
  allowedComponents: string[] = [];

  // All available components with route and display name
  allComponents = [
    { name: 'Create User', route: 'create-new-user' },
    { name: 'Employee List', route: 'employee-list' },
    { name: 'Reports', route: 'reports' },
    { name: 'Settings', route: 'settings' }
  ];

  ngOnInit() {
    this.role = localStorage.getItem('role') || '';

    if (this.role === 'Admin') {
      // Admin sees all components
      this.allowedComponents = this.allComponents.map(c => c.route);
    } else {
      // Other users get access from stored permission list (from login)
      this.allowedComponents = JSON.parse(localStorage.getItem('access') || '[]');
    }
  }
}
