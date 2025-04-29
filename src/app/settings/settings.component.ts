import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { CategoriesComponent } from '../categories/categories.component';
import { AccountsComponent } from '../accounts/accounts.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, MatTabsModule, CategoriesComponent, AccountsComponent, TranslateModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {}
