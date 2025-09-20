import { Component, OnInit } from '@angular/core';
import { AssetService } from '../../service/asset';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-asset',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './add-asset.html',
  styleUrls: ['./add-asset.css']
})
export class AddAsset implements OnInit {

  // Form model for adding asset
  asset = {
    asset_tag: '',
    type: '',
    brand: '',
    model: '',
    serial_number: ''
  };

  // List of all assets
  assets: any[] = [];

  constructor(private assetService: AssetService) { }

  ngOnInit(): void {
    this.loadAssets();
  }

  // Save a new asset
  saveAsset() {
    this.assetService.addAsset(this.asset).subscribe({
      next: (res) => {
        alert('✅ Asset Added Successfully');
        this.asset = { asset_tag: '', type: '', brand: '', model: '', serial_number: '' }; // reset form
        this.loadAssets(); // refresh list after adding
      },
      error: (err) => {
        if (err.error && err.error.error) {
          alert("Error: " + err.error.error);
        } else {
          alert("Unexpected error occurred while adding asset.");
        }
      }
    });
  }

  // Load all assets
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
}
