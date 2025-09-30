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
  email: string = '';
  password: string = '';
  error: string = '';

  constructor(private authService: AuthService, private router: Router) { }

  login() {
    this.error = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.authService.saveUserData(res);
          localStorage.setItem('token', res.token);
          localStorage.setItem('email', res.email);
          localStorage.setItem('role', res.role);
          // ✅ Redirect based on role
          this.router.navigate([this.authService.getRoleDashboard()]);
        } else {
          this.error = res.message || 'Login failed. Please try again.';
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Invalid email or password';
      }
    });
  }
}
