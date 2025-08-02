import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';
import { AuthService } from '../../service/auth';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';


// Register Chart.js components
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboard implements OnInit {
  data: any = {};

  barChartData = {
    labels: [] as string[],
    datasets: [
      {
        label: 'Branch Sales',
        data: [] as number[],
        backgroundColor: '#3b82f6'
      }
    ]
  };

  constructor(private auth: AuthService, private router: Router) { }

  ngOnInit() {
    this.auth.getData('admin-data').subscribe({
      next: (res: any) => {
        this.data = res.data;

        // Update chart data dynamically from API response
        if (this.data.sales?.length) {
          this.barChartData.labels = this.data.sales.map((s: any) => s.branch);
          this.barChartData.datasets[0].data = this.data.sales.map((s: any) => s.amount);
        }
      },
      error: err => {
        console.error('Failed to load admin data:', err);
        this.router.navigate(['/admin-dashboard']);
      }
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
