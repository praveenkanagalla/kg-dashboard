import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { ForgotPassword } from './components/forgot-password/forgot-password';
import { ResetPassword } from './components/reset-password/reset-password';
import { Dashboard } from './pages/dashboard/dashboard';
import { PermissionGuard } from './permission-guard';
import { Settings } from './components/settings/settings';
import { NewEmployee } from './components/new-employee/new-employee';
import { AllUsers } from './components/all-users/all-users';
import { ChilkooruReport } from './components/chilkooru-report/chilkooru-report';
import { SettlementReportTable } from './components/settlement-report-table/settlement-report-table';
import { AddAsset } from './components/add-asset/add-asset';

export const routes: Routes = [
    { path: 'login', component: Login },
    { path: 'forgot-password', component: ForgotPassword },
    { path: 'reset-password', component: ResetPassword },
    {
        path: ':role-dashboard',
        component: Dashboard,
        children: [
            {
                path: 'new-employee',
                component: NewEmployee,
                canActivate: [PermissionGuard],
                data: { permission: 'view_new_employee' }
            },
            {
                path: 'Settlement-report-table',
                component: SettlementReportTable,
                canActivate: [PermissionGuard],
                data: { permission: 'view_Settlement_report_table' }
            },
            {
                path: 'chilkooru-report',
                component: ChilkooruReport,
                canActivate: [PermissionGuard],
                data: { permission: 'view_chilkooru_report' }
            },
            {
                path: 'all-users',
                component: AllUsers,
            },
            {
                path: 'settings',
                component: Settings,
                canActivate: [PermissionGuard],
                data: { permission: 'view_settings' }
            },
            {
                path: 'add-new-asset',
                component: AddAsset,
                canActivate: [PermissionGuard],
                data: { permission: 'view_add_new_asset' }
            }
        ]
    },

    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: '**', redirectTo: '/login' }  // wildcard route for unknown URLs
];
