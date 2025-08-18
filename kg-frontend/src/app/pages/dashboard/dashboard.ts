import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { Sidebar } from '../../components/sidebar/sidebar';
import { HttpClient } from '@angular/common/http';
import { Modal } from '../../components/modal/modal';
import { UserDetails } from '../../components/user-details/user-details';

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
  imports: [RouterModule, Sidebar, CommonModule, Modal, UserDetails],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit {
  pageTitle: string = '';
  userName: string = '';
  role: string = '';
  user: User | null = null;
  userId: number | null = null;

  constructor(private route: ActivatedRoute, private router: Router, private http: HttpClient) { }


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
  }

  capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  showModal = false;   // stays false at start

  openModal() {
    this.showModal = true;
  }
  closeModal() {
    this.showModal = false;
  }


  logout(): void {
    localStorage.clear();
    window.location.href = '/';
  }
}