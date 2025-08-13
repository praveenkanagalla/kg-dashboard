import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { ForgotPassword } from './components/forgot-password/forgot-password';
import { ResetPassword } from './components/reset-password/reset-password';
import { Dashboard } from './pages/dashboard/dashboard';
import { CreateNewUser } from './components/create-new-user/create-new-user';
import { PermissionGuard } from './permission-guard';
import { Settings } from './components/settings/settings';
import { UserDetails } from './components/user-details/user-details';

export const routes: Routes = [
    { path: 'login', component: Login },
    { path: 'forgot-password', component: ForgotPassword },
    { path: 'reset-password', component: ResetPassword },

    {
        path: ':role-dashboard',
        component: Dashboard,
        children: [
            {
                path: 'user/:id',          // user detail page
                component: UserDetails,
                canActivate: [PermissionGuard]
            },
            {
                path: 'create-new-user',   // create user page
                component: CreateNewUser,
                canActivate: [PermissionGuard],
                data: { permission: 'view_create_new_user' }
            },
            {
                path: 'settings',          // settings page
                component: Settings,
                canActivate: [PermissionGuard],
                data: { permission: 'view_settings' }
            }
            // {
            //     path: '',                  // default child route
            //     redirectTo: 'user/:id',    // you can change this to dashboard default
            //     pathMatch: 'full'
            // }
        ]
    },

    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: '**', redirectTo: '/login' }  // wildcard route for unknown URLs
];
