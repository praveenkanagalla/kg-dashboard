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

  userForm: FormGroup;

  roles = ['Owner', 'User', 'ManagerCLK', 'ManagerLB', 'ManagerKP', 'Admin'];

  allPermissions = [
    { name: 'Create User', route: 'view_create_new_user' },
    { name: 'Settings', route: 'view_settings' }
  ];

  permissionsList = [...this.allPermissions]; // filtered in ngOnInit

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      phone: ['', Validators.required],
      role: ['', Validators.required],
      blood_group: ['', Validators.required], // Added Blood Group
      address: [''],                           // Added Address (optional)
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
    if (this.userForm.valid) {
      this.http.post<{ id: number }>('http://localhost:5000/api/users', this.userForm.value).subscribe({
        next: (userRes) => {
          const userId = userRes.id;
          const permissionsData = {
            user_id: userId,
            permissions: this.userForm.value.permissions || []
          };

          this.http.post('http://localhost:5000/api/permissions', permissionsData).subscribe({
            next: () => {
              alert('User and permissions created successfully');
              this.userForm.reset({ permissions: [] });
            },
            error: () => alert('Error creating permissions')
          });
        },
        error: () => alert('Error creating user')
      });
    } else {
      this.userForm.markAllAsTouched();
    }
  }
}