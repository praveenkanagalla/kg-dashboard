// permission-guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './service/auth';

@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // ===== 1. Check role matches the URL =====
    const roleDashboard = route.parent?.params['role-dashboard']; // e.g. "admin-dashboard"
    const userRoleDashboard = this.auth.getRoleDashboard(); // e.g. "admin-dashboard"

    if (roleDashboard && roleDashboard !== userRoleDashboard) {
      this.router.navigate(['/login']);
      return false;
    }

    // ===== 2. Determine required permission =====
    let requiredPermission = route.data?.['permission'] as string | undefined;

    // If no explicit permission in route data, fallback to hardcoded map
    if (!requiredPermission) {
      const routePath = route.routeConfig?.path || '';
      const permissionMap: { [key: string]: string } = {
        'create-new-user': 'view_create_new_user',
        'new-employee': 'view_new_employee',
        'settings': 'view_settings',
        'chilkooru-report': 'view_chilkooru_report'
      };
      requiredPermission = permissionMap[routePath];
    }

    // ===== 3. If permission required, check it =====
    if (requiredPermission && !this.auth.hasPermission(requiredPermission)) {
      this.router.navigate([`/${userRoleDashboard}`]); // back to dashboard
      return false;
    }

    return true;
  }
}
