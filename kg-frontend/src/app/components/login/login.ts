import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth';
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
        // Set token, role, and permissions inside auth service (manages localStorage)


        // Store additional info if you want
        localStorage.setItem('name', res.name);
        localStorage.setItem('email', res.email);
        localStorage.setItem('role', res.role);
        localStorage.setItem('permissions', res.permissions);
        localStorage.setItem('token', res.token);

        // Navigate dynamically based on role

        this.router.navigate([`/${res.role}-dashboard`]);
      },
      error: (err) => {
        console.error('Login failed', err);
        this.error = 'Invalid email or password.';
      }
    });
  }
}
