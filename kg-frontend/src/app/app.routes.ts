import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { ForgotPassword } from './components/forgot-password/forgot-password';
import { ResetPassword } from './components/reset-password/reset-password';
import { Dashboard } from './pages/dashboard/dashboard';
import { CreateNewUser } from './components/create-new-user/create-new-user';
import { PermissionGuard } from './permission-guard';
import { Settings } from './components/settings/settings';
import { UserDetails } from './components/user-details/user-details';
import { NewEmployee } from './components/new-employee/new-employee';
import { AuthGuard } from './guards/auth-guard';
import { AllUsers } from './components/all-users/all-users';
import { ChilkooruReport } from './components/chilkooru-report/chilkooru-report';

export const routes: Routes = [
    { path: 'login', component: Login },
    { path: 'forgot-password', component: ForgotPassword },
    { path: 'reset-password', component: ResetPassword },
    {
        path: ':role-dashboard',
        component: Dashboard,
        children: [
            // {
            //     path: 'user/:id',          // user detail page
            //     component: UserDetails,
            //     canActivate: [AuthGuard]
            // },
            {
                path: 'create-new-user',   // create user page
                component: CreateNewUser,
                canActivate: [PermissionGuard],
                data: { permission: 'view_create_new_user' }
            },
            {
                path: 'new-employee',
                component: NewEmployee,
                canActivate: [PermissionGuard],
                data: { permission: 'view_new_employee' }
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
                path: 'settings',          // settings page
                component: Settings,
                canActivate: [PermissionGuard],
                data: { permission: 'view_settings' }
            },

        ]
    },

    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: '**', redirectTo: '/login' }  // wildcard route for unknown URLs
];
