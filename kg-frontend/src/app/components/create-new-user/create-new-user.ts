import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-new-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './create-new-user.html',
  styleUrls: ['./create-new-user.css']
})
export class CreateNewUser implements OnInit {

  role = '';
  dropdownOpen = false;

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  userForm: FormGroup;

  roles = ['Owner', 'User', 'Manager-CLK', 'Manager-LB', 'Manager-KP'];

  allPermissions = [
    { name: 'Create User', route: 'create-new-user' },
    { name: 'Employee List', route: 'employee-list' },
    { name: 'Reports', route: 'reports' },
    { name: 'Settings', route: 'settings' }
  ];

  permissionsList = [...this.allPermissions]; // default copy

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      phone: ['', Validators.required],
      role: ['', Validators.required],
      permissions: [[]]
    });
  }

  ngOnInit() {
    this.role = localStorage.getItem('role') || '';

    if (this.role.toLowerCase() === 'admin' || this.role.toLowerCase() === 'owner') {
      // Admin or Owner sees all permissions
      this.permissionsList = [...this.allPermissions];
    } else {
      // Other users see only allowed permissions
      const allowedRoutes: string[] = JSON.parse(localStorage.getItem('access') || '[]');
      this.permissionsList = this.allPermissions.filter(p => allowedRoutes.includes(p.route));
    }
  }

  onSubmit() {
    if (this.userForm.valid) {
      this.http.post('http://localhost:5000/api/users', this.userForm.value).subscribe({
        next: () => alert('User created successfully'),
        error: () => alert('Error creating user')
      });
    }
  }

  selectedPermissionsLabel(): string {
    const selected = this.userForm.get('permissions')?.value;
    if (!selected || selected.length === 0) return 'Select Permissions';
    return selected.join(', ');
  }

  onAccessChange(event: any) {
    const current = this.userForm.get('permissions')?.value || [];
    if (event.target.checked) {
      if (!current.includes(event.target.value)) {
        current.push(event.target.value);
      }
    } else {
      const index = current.indexOf(event.target.value);
      if (index > -1) current.splice(index, 1);
    }
    this.userForm.patchValue({ permissions: current });
  }
}
