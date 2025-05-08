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
import { Firestore, collection, getDocs, query, orderBy, where, Timestamp } from '@angular/fire/firestore';
import { DashboardSummaryHeaderComponent } from '../dashboard-summary-header/dashboard-summary-header.component';
import { ExpensesFilterComponent } from '../expenses-filter/expenses-filter.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatCardModule,
    MatExpansionModule,
    DashboardSummaryComponent,
    DashboardSummaryHeaderComponent,
    ExpensesFilterComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private auth = inject(Auth);
  private firebaseService = inject(FirebaseService);
  private translate = inject(TranslateService);
  private firestore = inject(Firestore);
  private langSub?: Subscription;
  expenses: any[] = [];
  accounts: any[] = [];
  categories: any[] = [];

  lang: string = 'en';

  monthlySummaryExpanded = true;
  toggleMonthlySummary() {
    this.monthlySummaryExpanded = !this.monthlySummaryExpanded;
  }

  initialDateFrom: Date;
  initialDateTo: Date;
  filter: any = {};

  constructor() {
    // Default to current month
    const now = new Date();
    this.initialDateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    this.initialDateTo = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  async ngOnInit() {
    const user = await this.auth.currentUser;
    if (!user) return;
    await this.loadAccountsAndCategories(user.uid);
    await this.queryExpensesWithFilter({
      dateFrom: this.initialDateFrom,
      dateTo: this.initialDateTo
    });
    this.lang = this.translate.currentLang || 'en';
    this.langSub = this.translate.onLangChange.subscribe(() => {});
  }

  async onFilterChange(filter: any) {
    this.filter = filter;
    await this.queryExpensesWithFilter(filter);
  }

  async loadAccountsAndCategories(uid: string) {
    const [accountsSnap, categoriesSnap] = await Promise.all([
      this.firebaseService.getAllForUser(uid, 'accounts'),
      this.firebaseService.getAllForUser(uid, 'categories'),
    ]);
    this.accounts = accountsSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
    this.categories = categoriesSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  async queryExpensesWithFilter(filter: any) {
    const user = await this.auth.currentUser;
    if (!user) return;
    let expensesRef = collection(this.firestore, `users/${user.uid}/expenses`);
    let q: any[] = [];
    let dateFrom = filter.dateFrom;
    let dateTo = filter.dateTo;
    if (dateFrom) {
      q.push(where('date', '>=', Timestamp.fromDate(new Date(dateFrom))));
    }
    if (dateTo) {
      // Set to end of day
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      q.push(where('date', '<=', Timestamp.fromDate(toDate)));
    }
    q.push(orderBy('date', 'desc'));
    const queryRef = q.length ? query(expensesRef, ...q) : expensesRef;
    const expensesSnap = await getDocs(queryRef);
    this.expenses = expensesSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
  }

  ngOnDestroy() {
    if (this.langSub) this.langSub.unsubscribe();
  }

  get user() {
    return this.auth.currentUser;
  }
}
