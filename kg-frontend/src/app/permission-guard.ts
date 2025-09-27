// permission-guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './service/auth';

@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // ===== 1. Check role matches the URL =====
    const roleDashboard = route.parent?.params['role-dashboard'];
    const userRoleDashboard = this.auth.getRoleDashboard();
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
        'new-employee': 'view_new_employee',
        'settings': 'view_settings',
        'all-users': 'view_all_users',
        'Settlement-report-table': 'view_Settlement_report_table',
        'add-new-asset': 'view_add_new_asset',
        'asset-assign-to-employee': 'view_asset_assign_to_employee'
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



// --first create Add new asset and list of assets one component
// -- how Assets assigned Employee and Reports(Total assets by type, Assets assigned vs available,
//    Assets by condition(working, repair, retired)
//     one component angular20 and python my sql work beanch code step by step
