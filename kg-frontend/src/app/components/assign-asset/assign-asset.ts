import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../service/auth';

interface User {
  id: number;
  name: string;
  department: string;
}

interface Asset {
  id: number;
  asset_tag: string;
  type: string;
  brand: string;
  model: string;
  status: string;
}

interface AssignedAsset {
  id: number;
  asset_tag: string;
  type: string;
  brand: string;
  model: string;
  user_name: string;
  department: string;
  assigned_date: string;
  status: string;
}

@Component({
  selector: 'app-assign-asset',
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './assign-asset.html',
  styleUrl: './assign-asset.css'
})
export class AssignAsset implements OnInit {

  users: User[] = [];
  assets: Asset[] = [];
  assignedAssets: AssignedAsset[] = [];

  selectedUserId!: number;
  selectedAssetId!: number;

  constructor(private http: HttpClient, public auth: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.loadUsers();
    this.loadAssets();
    this.loadAssignedAssets();
  }

  loadUsers() {
    this.http.get<User[]>('http://localhost:5000/get_users').subscribe(
      data => this.users = data,
      err => console.error('Error fetching users', err)
    );
  }

  loadAssets() {
    this.http.get<Asset[]>('http://localhost:5000/assets').subscribe(
      data => {
        this.assets = data.filter(a => a.status === 'Available'); // only available
      },
      err => console.error('Error fetching assets', err)
    );
  }

  loadAssignedAssets() {
    this.http.get<AssignedAsset[]>('http://localhost:5000/assigned_assets').subscribe(
      data => this.assignedAssets = data,
      err => console.error('Error fetching assigned assets', err)
    );
  }

  assignAsset() {
    if (!this.selectedUserId || !this.selectedAssetId) {
      alert('Select user and asset');
      return;
    }

    const payload = {
      user_id: this.selectedUserId,
      asset_id: this.selectedAssetId
    };

    this.http.post('http://localhost:5000/assign_asset_to_user', payload).subscribe({
      next: (res: any) => {
        alert(res.message);
        this.loadAssets();
        this.loadAssignedAssets();
        this.selectedUserId = 0;
        this.selectedAssetId = 0;
      },
      error: (err) => {
        console.error(err);
        alert(err.error?.error || 'Failed to assign asset');
      }
    });
  }

  returnAsset(assignmentId: number) {
    this.http.put(`http://localhost:5000/return_asset/${assignmentId}`, {}).subscribe({
      next: (res: any) => {
        alert(res.message);
        this.loadAssets();
        this.loadAssignedAssets();
      },
      error: (err) => {
        console.error(err);
        alert(err.error?.error || 'Failed to return asset');
      }
    });
  }

  BackToAssetPage() {
    console.log("Hello")
    this.router.navigate(['/', this.auth.getRoleDashboard(), 'add-new-asset']);
  }

}
