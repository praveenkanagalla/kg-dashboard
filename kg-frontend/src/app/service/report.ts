import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = 'http://localhost:5000'; // Flask backend

  constructor(private http: HttpClient) { }

  getMonthlySale(month: string): Observable<{ monthly_sale: number }> {
    return this.http.get<{ monthly_sale: number }>(
      `${this.apiUrl}/get-monthly-sale/${month}`
    );
  }
}
