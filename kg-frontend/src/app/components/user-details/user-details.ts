import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-details.html',
  styleUrl: './user-details.css'
})
export class UserDetails implements OnInit {
  userId!: number;
  user: any;
  loading = true;
  error: string | null = null;

  constructor(private route: ActivatedRoute, private http: HttpClient) { }

  ngOnInit(): void {
    this.userId = Number(this.route.snapshot.paramMap.get('id'));
    this.http.get(`http://localhost:5000/api/users/${this.userId}`)
      .subscribe({
        next: (data) => this.user = data,
        error: () => console.error('User not found')
      });
  }

  getUserDetails(): void {
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
}
