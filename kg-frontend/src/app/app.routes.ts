import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { ForgotPassword } from './components/forgot-password/forgot-password';
import { ResetPassword } from './components/reset-password/reset-password';
import { AdminDashboard } from './pages/admin-dashboard/admin-dashboard';
import { ManagerDashboard } from './pages/manager-dashboard/manager-dashboard';
import { OwnerDashboard } from './pages/owner-dashboard/owner-dashboard';

export const routes: Routes = [
    { path: "", component: Login },
    { path: "forgot-password", component: ForgotPassword },
    { path: "reset-password", component: ResetPassword },
    { path: "admin-dashboard", component: AdminDashboard },
    { path: "manager-dashboard", component: ManagerDashboard },
    { path: "owner-dashboard", component: OwnerDashboard },
];
