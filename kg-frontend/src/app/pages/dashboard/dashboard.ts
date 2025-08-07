import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../components/sidebar/sidebar';

@Component({
  selector: 'app-dashboard',
  imports: [RouterModule, Sidebar],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit {
  pageTitle: string = '';
  userName: string = '';
  role: string = '';

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    const routeSegment = this.route.snapshot.paramMap.get('role-dashboard');
    const role = routeSegment?.split('-')[0];
    this.pageTitle = role ? `${this.capitalize(role)}` : '';
    const storedName = localStorage.getItem('name') || '';
    this.userName = storedName ? this.capitalize(storedName) : '';
    this.role = localStorage.getItem('role') || '';
  }

  capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  logout(): void {
    localStorage.clear();
    window.location.href = '/';
  }
}
