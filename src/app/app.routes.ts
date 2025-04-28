import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';
import { ExpensesComponent } from './expenses/expenses.component';
import { ExpensesListComponent } from './expenses-list/expenses-list.component';
import { CategoriesComponent } from './categories/categories.component';
import { AccountsComponent } from './accounts/accounts.component';
import { CategoriesResolver } from './resolvers/categories.resolver';
import { AccountsResolver } from './resolvers/accounts.resolver';
import { SettingsComponent } from './settings/settings.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'expenses', component: ExpensesComponent, canActivate: [authGuard] },
  { path: 'expenses-list', component: ExpensesListComponent, canActivate: [authGuard], resolve: { categories: CategoriesResolver, accounts: AccountsResolver } },
  { path: 'categories', component: CategoriesComponent, canActivate: [authGuard] },
  { path: 'accounts', component: AccountsComponent, canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
