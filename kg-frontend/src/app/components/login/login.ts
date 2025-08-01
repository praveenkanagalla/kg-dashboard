import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  email = '';
  password = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) { }

  login() {
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res: any) => {
        console.log(res);
        localStorage.setItem('token', res.token);
        localStorage.setItem('role', res.role);
        localStorage.setItem('name', res.name);
        localStorage.setItem('email', res.email);


        // Role-based redirection
        if (res.role === 'admin') {
          this.router.navigate(['/admin-dashboard']);
        } else if (res.role === 'manager') {
          this.router.navigate(['/manager-dashboard']);
        } else if (res.role === 'owner') {
          this.router.navigate(['/owner-dashboard']);
        } else {
          this.error = 'Unknown user role';
        }
      },
      error: () => {
        this.error = 'Invalid credentials';
      }
    });
  }
}

