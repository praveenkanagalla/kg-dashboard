// permission-guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './service/auth';

@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // ===== 1. Check role matches the dashboard =====
    const roleDashboard = route.parent?.params['role-dashboard']; // e.g. 'admin-dashboard'
    const userRoleDashboard = this.auth.getRoleDashboard();     // e.g. 'admin-dashboard'

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
        'create-new-user': 'create new employee',
        'new-employee': 'create new employee',
        'settings': 'settings'
      };
      requiredPermission = permissionMap[routePath];
    }

    // ===== 3. Check if user has permission =====
    const userPermissions = this.auth.getPermissions() || []; // should return string[]
    if (requiredPermission && !userPermissions.includes(requiredPermission.toLowerCase())) {
      // Redirect back to dashboard
      this.router.navigate([`/${userRoleDashboard}`]);
      return false;
    }

    return true;
  }
}
