import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface User {
  userId: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  blood_group?: string;
  address?: string;
  permissions?: string[];
}

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-details.html',
  styleUrls: ['./user-details.css'] // ✅ plural, not styleUrl
})
export class UserDetails implements OnInit {
  userId!: number;
  user: any;
  loading = true;
  error: string | null = null;


  constructor(private route: ActivatedRoute, private http: HttpClient) { }

  ngOnInit(): void {
    this.userId = Number(this.route.snapshot.paramMap.get('id'));
    this.getUserDetails(); // ✅ Fetch data on init
  }

  getUserDetails(): void {
    this.loading = true;
    this.http.get(`http://localhost:5000/api/users/${this.userId}`)
      .subscribe({
        next: (data) => {
          this.user = data;
          this.loading = false;
        },
        error: () => {
          this.error = 'Failed to load user details';
          this.loading = false;
        }
      });
  }

  // 3️⃣ Fetch user details from backend
  // const storedUserId = localStorage.getItem('userId');
  // if(storedUserId) {
  //   this.http
  //     .get<{ userId: number; user: User }>(
  //       `http://localhost:5000/api/users/${storedUserId}`
  //     )
  //     .subscribe({
  //       next: (res) => {
  //         this.userId = res.userId;
  //         this.user = res.user;
  //         this.role = this.user.role;
  //       },
  //       error: () => {
  //         console.error('Failed to load user details from backend');
  //       },
  //     });
  // }
}

