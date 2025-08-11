import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './service/auth';

@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredPermission = route.data['permission'];
    const userRole = this.auth.getRole();

    // Admin role bypasses all permission checks
    if (userRole.toLowerCase() === 'admin') {
      return true;
    }

    // Check for required permission
    if (requiredPermission && this.auth.hasPermission(requiredPermission)) {
      return true;
    }

    // Redirect to no-access page if not authorized
    // this.router.navigate(['/no-access']);
    return false;
  }
}
