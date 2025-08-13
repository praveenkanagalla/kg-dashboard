import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Sidebar } from '../../components/sidebar/sidebar';
import { HttpClient } from '@angular/common/http';

interface User {
  userId: number;   // matches backend
  id?: number;      // optional if you want to map
  name: string;
  email?: string;
  role?: string;
  phone?: string;
  permissions?: string[];
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterModule, Sidebar, CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit {
  pageTitle: string = '';
  userName: string = '';
  role: string = '';
  user: User | null = null;
  userId: number | null = null;

  constructor(private route: ActivatedRoute, private http: HttpClient) { }

  ngOnInit(): void {
    // 1️⃣ Set page title from route
    const routeSegment = this.route.snapshot.paramMap.get('role-dashboard');
    const role = routeSegment?.split('-')[0];
    this.pageTitle = role ? this.capitalize(role) : '';

    // 2️⃣ Load basic info from localStorage
    const storedName = localStorage.getItem('name') || '';
    this.userName = storedName ? this.capitalize(storedName) : '';
    this.role = localStorage.getItem('role') || '';

    // 3️⃣ Load user info from localStorage
    // Load user info from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
      this.userId = this.user?.userId || null; // ✅ safe access
    }

    // 4️⃣ Fetch full user info from backend if userId exists
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      const userIdNum = Number(storedUserId);
      this.http.get<User>(`http://localhost:5000/api/users/${userIdNum}`)
        .subscribe({
          next: (userData: User) => {
            this.user = userData;
            this.userId = userData.userId;  // ensure userId is set
            this.userName = this.user.name;
            this.role = this.user.role || '';
          },
          error: () => {
            console.error("Failed to load user details from backend");
          }
        });
    }
  }

  capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  logout(): void {
    localStorage.clear();
    window.location.href = '/';
  }
}