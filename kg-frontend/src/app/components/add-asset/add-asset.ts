import { Component, OnInit } from '@angular/core';
import { AssetService } from '../../service/asset';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../service/auth';

@Component({
  selector: 'app-add-asset',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './add-asset.html',
  styleUrls: ['./add-asset.css']
})
export class AddAsset implements OnInit {

  asset = {
    id: null,
    asset_tag: '',
    type: '',
    brand: '',
    model: '',
    serial_number: '',
    status: 'Available'
  };

  assets: any[] = [];

  // 🔍 Search term for filtering
  searchTerm: string = '';

  isEditing: boolean = false;
  showModal: boolean = false;

  constructor(private assetService: AssetService, public auth: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.loadAssets();
  }

  // ✅ Filtering logic
  filteredAssets() {
    if (!this.searchTerm) return this.assets;

    const term = this.searchTerm.toLowerCase();
    return this.assets.filter(a =>
      (a.asset_tag && a.asset_tag.toLowerCase().includes(term)) ||
      (a.type && a.type.toLowerCase().includes(term)) ||
      (a.brand && a.brand.toLowerCase().includes(term)) ||
      (a.model && a.model.toLowerCase().includes(term)) ||
      (a.serial_number && a.serial_number.toLowerCase().includes(term)) ||
      (a.status && a.status.toLowerCase().includes(term))
    );
  }

  saveAsset() {
    if (this.isEditing && this.asset.id) {
      this.assetService.updateAsset(this.asset.id, this.asset).subscribe({
        next: () => {
          alert('Asset Updated Successfully');
          this.resetForm();
          this.loadAssets();
        },
        error: (err) => {
          alert("Error updating asset: " + (err.error?.error || 'Unexpected error'));
        }
      });
    } else {
      this.assetService.addAsset(this.asset).subscribe({
        next: () => {
          alert('Asset Added Successfully');
          this.resetForm();
          this.loadAssets();
        },
        error: (err) => {
          alert("Error adding asset: " + (err.error?.error || 'Unexpected error'));
        }
      });
    }
  }

  editAsset(asset: any) {
    this.asset = { ...asset };
    this.isEditing = true;
  }

  resetForm() {
    this.asset = {
      id: null,
      asset_tag: '',
      type: '',
      brand: '',
      model: '',
      serial_number: '',
      status: 'Available'
    };
    this.isEditing = false;
  }

  deleteAsset(id: number) {
    if (confirm('Are you sure you want to delete this asset?')) {
      this.assetService.deleteAsset(id).subscribe({
        next: () => {
          alert('Asset deleted successfully');
          this.loadAssets();
        },
        error: (err) => {
          alert("Error deleting asset: " + (err.error?.error || 'Unexpected error'));
        }
      });
    }
  }

  loadAssets() {
    this.assetService.getAssets().subscribe({
      next: (res) => {
        this.assets = res;
      },
      error: (err) => {
        console.error('Error fetching assets', err);
      }
    });
  }

  OpneAssignAsset() {
    this.router.navigate(['/', this.auth.getRoleDashboard(), 'assign-asset']);
  }

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.resetForm();
  }
}
