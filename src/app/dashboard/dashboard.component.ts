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
import { Firestore, collection, getDocs, query, orderBy, where } from '@angular/fire/firestore';
import { DashboardSummaryHeaderComponent } from '../dashboard-summary-header/dashboard-summary-header.component';

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

  async ngOnInit() {
    const user = await this.auth.currentUser;
    if (!user) return;
    // Get current month range
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    // Query Firestore for only current month expenses
    const expensesRef = collection(this.firestore, `users/${user.uid}/expenses`);
    const q = query(
      expensesRef,
      where('date', '>=', monthStart),
      where('date', '<=', monthEnd),
      orderBy('date', 'desc')
    );
    const expensesSnap = await getDocs(q);
    this.expenses = expensesSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    // Fetch accounts and categories as before
    const [accountsSnap, categoriesSnap] = await Promise.all([
      this.firebaseService.getAllForUser(user.uid, 'accounts'),
      this.firebaseService.getAllForUser(user.uid, 'categories'),
    ]);
    this.accounts = accountsSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
    this.accounts = [...this.accounts];
    this.categories = categoriesSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
    this.categories = [...this.categories];
    this.lang = this.translate.currentLang || 'en';
    this.langSub = this.translate.onLangChange.subscribe(() => {});
  }

  ngOnDestroy() {
    if (this.langSub) this.langSub.unsubscribe();
  }

  get user() {
    return this.auth.currentUser;
  }
}
