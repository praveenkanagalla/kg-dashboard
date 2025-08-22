import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface User {
  id: number;
  name: string;
  email?: string;
  role?: string;
  phone?: string;
  permissions?: string[];
}

@Component({
  selector: 'app-all-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './all-users.html',
  styleUrls: ['./all-users.css']
})
export class AllUsers implements OnInit {
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
  permissionsInput: string = '';

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    this.fetchAllUsers();
  }

  fetchAllUsers(): void {
    this.loading = true;
    this.http.get<User[]>(`http://localhost:5000/get_users`).subscribe({
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

  // Search filter
  filterUsers() {
    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.allUsers.filter(u =>
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.role?.toLowerCase().includes(term)
    );
  }

  // View modal
  openModalView(user: User) {
    this.selectedUser = user;
    this.showModalView = true;
  }
  closeModalView() {
    this.showModalView = false;
    this.selectedUser = null;
  }

  // Edit modal
  openModalEdit(user: User) {
    this.editUserData = { ...user }; // clone data
    this.permissionsInput = user.permissions?.join(', ') || '';
    this.showModalEdit = true;
  }

  closeModalEdit() {
    this.showModalEdit = false;
    this.editUserData = {};
  }

  // Update user
  updateUser() {
    const updatedUser = {
      ...this.editUserData,
      permissions: this.permissionsInput.split(',').map(p => p.trim())
    };

    this.http.put(`http://localhost:5000/update_user/${updatedUser.id}`, updatedUser)
      .subscribe({
        next: () => {
          alert('User updated successfully!');
          this.closeModalEdit();
          this.fetchAllUsers(); // refresh list
        },
        error: () => alert('Failed to update user')
      });
  }
}
