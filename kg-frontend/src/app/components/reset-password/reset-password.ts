import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css']
})
export class ResetPassword implements OnInit {
  resetForm: FormGroup;
  message: string = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.resetForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void { }

  // Validator: newPassword === confirmPassword
  passwordMatchValidator(form: FormGroup) {
    return form.get('newPassword')!.value === form.get('confirmPassword')!.value
      ? null : { mismatch: true };
  }

  onSubmit() {
    if (!this.resetForm.valid) {
      this.message = 'Please check your inputs!';
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      this.message = 'You must be logged in to reset your password.';
      return;
    }

    const payload = {
      currentPassword: this.resetForm.value.currentPassword,
      newPassword: this.resetForm.value.newPassword
    };

    this.http.post('http://localhost:5000/api/reset-password', payload, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res: any) => {
        this.message = res.message || 'Password reset successfully!';
        this.resetForm.reset();
      },
      error: (err) => {
        console.error(err);
        this.message = err.error?.message || 'Failed to reset password';
      }
    });
  }

}
