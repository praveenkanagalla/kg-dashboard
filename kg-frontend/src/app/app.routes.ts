import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { ForgotPassword } from './components/forgot-password/forgot-password';
import { ResetPassword } from './components/reset-password/reset-password';
import { Dashboard } from './pages/dashboard/dashboard';
import { CreateNewUser } from './components/create-new-user/create-new-user';
import { PermissionGuard } from './permission-guard';
import { Settings } from './components/settings/settings';

export const routes: Routes = [
    { path: "login", component: Login },
    { path: "forgot-password", component: ForgotPassword },
    { path: "reset-password", component: ResetPassword },
    {
        path: ':role-dashboard',
        component: Dashboard,
        children: [
            {
                path: 'create-new-user',
                component: CreateNewUser,
                canActivate: [PermissionGuard]
            },
            {
                path: 'settings',
                component: Settings,
                canActivate: [PermissionGuard]
            }

            // more children
        ]
    },
    { path: '', redirectTo: '/login', pathMatch: 'full' }
];
