import { Component } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
  isSidebarCollapsed = false;

  constructor(public auth: AuthService, private router: Router) {}

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  get roleLabel(): string {
    return this.auth.currentUser?.role === 'ADMIN' ? 'Admin' : 'User';
  }

  canManage(): boolean {
    return this.auth.isAdmin();
  }
}
