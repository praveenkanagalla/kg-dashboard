import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../service/auth';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-settlement-report-table',
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './settlement-report-table.html',
  styleUrl: './settlement-report-table.css'
})
export class SettlementReportTable implements OnInit {
  settlement: any = {
    id: null,
    store: '',
    employee: '',
    date: '',
    totalAmount: 0,
    closingAmount: 0,
    remarks: ''
  };

  // 🔽 3 Stores Dropdown
  stores = ['Chilkooru', 'LB Nagar', 'Kukatpally'];

  reports: any[] = [];
  filteredReports: any[] = [];

  searchText: string = '';
  filter = { fromDate: '', toDate: '', store: '' };

  constructor(private http: HttpClient, public auth: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports() {
    this.http.get<any[]>('http://127.0.0.1:5000/reports')
      .subscribe((data) => {
        this.reports = data;
        this.filteredReports = data;
      });
  }

  applyFilter() {
    this.filteredReports = this.reports.filter(report => {
      const matchesSearch = this.searchText
        ? (report.employee?.toLowerCase().includes(this.searchText.toLowerCase()) ||
          report.remarks?.toLowerCase().includes(this.searchText.toLowerCase()))
        : true;

      const matchesStore = this.filter.store
        ? report.store === this.filter.store
        : true;

      const matchesFromDate = this.filter.fromDate
        ? new Date(report.date) >= new Date(this.filter.fromDate)
        : true;

      const matchesToDate = this.filter.toDate
        ? new Date(report.date) <= new Date(this.filter.toDate)
        : true;

      return matchesSearch && matchesStore && matchesFromDate && matchesToDate;
    });
  }

  NewReport() {
    this.router.navigate(['/', this.auth.getRoleDashboard(), 'chilkooru-report']);
  }
}