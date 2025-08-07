import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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

  dropdownOpen = false;
  userForm: FormGroup;
  roles = ['Owner', 'User', 'ManagerCLK', 'ManagerLB', 'ManagerKP'];

  allPermissions = [
    { name: 'Create User', route: '/create-new-user' }
  ];

  permissionsList = [...this.allPermissions];
  role = '';

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

  ngOnInit(): void {
    this.role = localStorage.getItem('role') ?? '';

    if (this.role.toLowerCase() === 'admin') {
      // Admin sees all permissions
      this.permissionsList = [...this.allPermissions];
    } else {
      // Non-admin: get permissions array from localStorage
      const permissionsRaw = localStorage.getItem('permissions') ?? '[]';

      let allowedPermissions: string[] = [];
      try {
        allowedPermissions = JSON.parse(permissionsRaw);
        if (!Array.isArray(allowedPermissions)) {
          allowedPermissions = [];
        }
      } catch {
        allowedPermissions = [];
      }

      // Filter allPermissions by matching names exactly
      this.permissionsList = this.allPermissions.filter(p =>
        allowedPermissions.includes(p.name)
      );

      console.log('Loaded permissions from localStorage:', allowedPermissions);
    }

    // Debug logs (remove in production)
    console.log('All available permissions:', this.allPermissions.map(p => p.name));
    console.log('Filtered permissionsList:', this.permissionsList.map(p => p.name));
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectedPermissionsLabel(): string {
    const selected = this.userForm.get('permissions')?.value;
    if (!selected || selected.length === 0) return 'Select Permissions';
    return selected.join(', ');
  }

  onAccessChange(event: any) {
    const current = this.userForm.get('permissions')?.value || [];
    if (event.target.checked) {
      if (!current.includes(event.target.value)) current.push(event.target.value);
    } else {
      const index = current.indexOf(event.target.value);
      if (index > -1) current.splice(index, 1);
    }
    this.userForm.patchValue({ permissions: current });
  }

  onSubmit() {
    if (this.userForm.valid) {
      this.http.post('http://localhost:5000/api/users', this.userForm.value).subscribe({
        next: () => {
          alert('User created successfully');
          this.userForm.reset();
          this.dropdownOpen = false;
        },
        error: (err) => {
          alert('Error creating user: ' + (err.error?.error || err.message));
        }
      });
    }
  }
}
