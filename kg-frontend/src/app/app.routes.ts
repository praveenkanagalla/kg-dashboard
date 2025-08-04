import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { ForgotPassword } from './components/forgot-password/forgot-password';
import { ResetPassword } from './components/reset-password/reset-password';
import { Dashboard } from './pages/dashboard/dashboard';
import { CreateNewUser } from './components/create-new-user/create-new-user';

export const routes: Routes = [
    { path: "", component: Login },
    { path: "forgot-password", component: ForgotPassword },
    { path: "reset-password", component: ResetPassword },
    {
        path: ':role-dashboard',
        component: Dashboard,
        children: [
            { path: 'create-new-user', component: CreateNewUser },
            // add more child routes here
        ]
    },
    { path: '', redirectTo: '/login', pathMatch: 'full' }
];
