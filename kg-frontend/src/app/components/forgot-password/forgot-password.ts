import { Component } from '@angular/core';
import { AuthService } from '../../service/auth';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css']
})
export class ForgotPassword {
  email: string = '';
  message: string = '';
  error: string = '';

  constructor(private auth: AuthService, private router: Router) { }

  submitEmail() {
    if (!this.email) {
      this.error = 'Email is required.';
      this.message = '';
      return;
    }

    this.auth.forgotPassword(this.email).subscribe({
      next: (res: any) => {
        this.message = res.message || 'Check your email for the reset link.';
        this.error = '';
      },
      error: (err) => {
        this.error = err.error?.message || 'Error sending reset email.';
        this.message = '';
      }
    });
  }
}
