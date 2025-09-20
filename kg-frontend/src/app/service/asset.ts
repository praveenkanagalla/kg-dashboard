import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AssetService {
  private apiUrl = 'http://localhost:5000';

  constructor(private http: HttpClient) { }

  getAssets(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/assets`);
  }

  addAsset(payload: any) {
    return this.http.post(`${this.apiUrl}/assets`, payload);
  }

  updateAsset(id: number, payload: any) {
    return this.http.put(`${this.apiUrl}/assets/${id}`, payload);
  }

  deleteAsset(id: number) {
    return this.http.delete(`${this.apiUrl}/assets/${id}`);
  }
}
