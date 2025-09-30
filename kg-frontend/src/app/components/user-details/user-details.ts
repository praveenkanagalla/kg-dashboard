import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface User {
  id: number;
  name: string;
  email?: string;
  role?: string;
  phone?: string;
  permissions?: string[];
}

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-details.html',
  styleUrls: ['./user-details.css']
})
export class UserDetails implements OnInit {

  currentUser: User | null = null;
  loadingUser = false;
  errorUser: string | null = null;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const userId = user.userId || user.id;
        if (userId) {
          this.fetchUserWithPermissions(userId, user.role);
        }
      }
    } catch (err) {
      console.error('Error reading user from storage', err);
    }
  }

  fetchUserWithPermissions(userId: number, role?: string): void {
    this.loadingUser = true;
    this.http.get<User>(`http://localhost:5000/api/users/${userId}`)
      .subscribe({
        next: (res) => {
          this.currentUser = res;
          this.loadingUser = false;
        },
        error: (err) => {
          console.error('Failed to load user details', err);
          this.errorUser = 'Failed to load user details';
          this.loadingUser = false;
        }
      });
  }
}
