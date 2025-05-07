import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FirebaseService } from '../shared/firebase.service';
import { Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { DashboardSummaryComponent } from '../dashboard-summary/dashboard-summary.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatCardModule,
    MatExpansionModule,
    DashboardSummaryComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private auth = inject(Auth);
  private firebaseService = inject(FirebaseService);
  private translate = inject(TranslateService);
  private langSub?: Subscription;
  expenses: any[] = [];
  accounts: any[] = [];
  categories: any[] = [];

  monthlySummaryExpanded = true;
  toggleMonthlySummary() {
    this.monthlySummaryExpanded = !this.monthlySummaryExpanded;
  }

  async ngOnInit() {
    const user = await this.auth.currentUser;
    if (!user) return;
    // Fetch expenses, accounts, and categories in parallel
    const [expensesSnap, accountsSnap, categoriesSnap] = await Promise.all([
      this.firebaseService.getAllForUser(user.uid, 'expenses'),
      this.firebaseService.getAllForUser(user.uid, 'accounts'),
      this.firebaseService.getAllForUser(user.uid, 'categories'),
    ]);
    this.expenses = expensesSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
    this.accounts = accountsSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
    this.categories = categoriesSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
    this.langSub = this.translate.onLangChange.subscribe(() => {});
  }

  ngOnDestroy() {
    if (this.langSub) this.langSub.unsubscribe();
  }

  get user() {
    return this.auth.currentUser;
  }
}
