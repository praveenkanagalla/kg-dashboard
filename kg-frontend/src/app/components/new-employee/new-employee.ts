import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-new-employee',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './new-employee.html',
  styleUrl: './new-employee.css'
})
export class NewEmployee implements OnInit {
  role = '';
  dropdownOpen = false;
  showAuthFields = false;

  toggleAuthDetails() {
    this.showAuthFields = !this.showAuthFields;
  }

  userForm: FormGroup;

  roles = ['Owner', 'User', 'ManagerCLK', 'ManagerLB', 'ManagerKP', 'Admin'];

  allPermissions = [
    { name: 'Create New Employee', route: 'view_new_employee' },
    { name: 'Settings', route: 'view_settings' },
    { name: 'Settlement-report-table', route: 'view_Settlement_report_table' },
    { name: 'all-users', route: 'view_all_users' },
    { name: 'add-new-asset', route: 'view_add_new_asset' }

  ];

  permissionsList = [...this.allPermissions]; // filtered in ngOnInit

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', Validators.required],
      department: ['', Validators.required],
      pan: ['', Validators.required],
      address: ['', Validators.required],
      country: ['', Validators.required],
      state: ['', Validators.required],
      city: ['', Validators.required],
      zip: ['', Validators.required],
      bank_name: ['', Validators.required],
      branch_name: ['', Validators.required],
      account_no: ['', Validators.required],
      ifsc_code: ['', Validators.required],
      account_holder: ['', Validators.required],
      working_branch: ['', Validators.required],
      wages: ['', Validators.required],
      email: [''],
      password: [''],
      role: [''],
      permissions: [[]]
    });

  }


  ngOnInit() {
    this.role = localStorage.getItem('role') || '';

    if (this.role.toLowerCase() === 'admin') {
      // Admin or Owner gets full permission list
      this.permissionsList = [...this.allPermissions];
    } else {
      // Other users only see permissions they have access to
      const allowedRoutes: string[] = JSON.parse(localStorage.getItem('access') || '[]');
      this.permissionsList = this.allPermissions.filter(p => allowedRoutes.includes(p.route));
    }
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectedPermissionsLabel(): string {
    const selectedRoutes: string[] = this.userForm.get('permissions')?.value || [];
    if (selectedRoutes.length === 0) return 'Select Permissions';

    if (selectedRoutes.length === this.permissionsList.length) return 'All Permissions';

    return selectedRoutes
      .map(route => {
        const perm = this.allPermissions.find(p => p.route === route);
        return perm ? perm.name : route;
      })
      .join(', ');
  }

  onAccessChange(event: any) {
    const current: string[] = this.userForm.get('permissions')?.value || [];
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

  onSubmit() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    // Prepare form data
    let formData = { ...this.userForm.value };

    // If auth fields are hidden, remove them
    if (!this.showAuthFields) {
      delete formData.email;
      delete formData.password;
      delete formData.role;
      delete formData.permissions;
    }

    this.http.post<{ id: number }>('http://localhost:5000/api/users', formData).subscribe({
      next: (res) => {
        alert('User created successfully!');
        this.userForm.reset({ permissions: [] });
      },
      error: (err) => {
        console.error(err);
        alert('Error creating user: ' + (err.error?.error || 'Server error'));
      }
    });
  }
}

