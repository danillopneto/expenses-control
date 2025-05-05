import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, addDoc, query, where, getDocs, CollectionReference, DocumentData, orderBy } from '@angular/fire/firestore';
import { inject } from '@angular/core';
import { SharedModule } from '../shared.module';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { FirebaseService } from '../shared/firebase.service';
import { ColDef } from 'ag-grid-community';
import { AgGridModule } from 'ag-grid-angular';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-expenses-list',
  standalone: true,
  imports: [SharedModule, CommonModule, MatTableModule, AgGridModule],
  templateUrl: './expenses-list.component.html',
  styleUrls: ['./expenses-list.component.scss']
})
export class ExpensesListComponent implements OnInit {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  expenses: any[] = [];
  loading = true;
  categoriesMap: Record<string, string> = {};
  accountsMap: Record<string, string> = {};

  columnDefs: ColDef[] = [];
  defaultColDef: ColDef = { resizable: true, sortable: true, filter: true };

  constructor(
    private route: ActivatedRoute,
    private firebaseService: FirebaseService,
    public translate: TranslateService
  ) {}

  async ngOnInit() {
    const user = this.auth.currentUser;
    if (!user) {
      this.expenses = [];
      this.loading = false;
      return;
    }
    // Get resolved categories and accounts
    const categories = this.route.snapshot.data['categories'] || [];
    const accounts = this.route.snapshot.data['accounts'] || [];
    this.categoriesMap = Object.fromEntries(categories.map((c: any) => [c.id, c.name]));
    this.accountsMap = Object.fromEntries(accounts.map((a: any) => [a.id, a.name]));

    // Set up AG Grid columns with formatting and localization
    this.setColumnDefs();
    this.translate.onLangChange.subscribe(() => this.setColumnDefs());

    // Fetch expenses from user-scoped subcollection, ordered by date descending
    const expensesRef = collection(this.firestore, `users/${user.uid}/expenses`);
    const q = query(expensesRef, orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    this.expenses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    this.loading = false;
  }

  setColumnDefs() {
    const lang = this.translate.currentLang || 'en';
    this.columnDefs = [
      {
        headerName: this.translate.instant('EXPENSES.DATE'),
        field: 'date',
        valueFormatter: (params: any) => {
          if (!params.value) return '';
          const date = new Date(params.value);
          if (isNaN(date.getTime())) return params.value;
          return new Intl.DateTimeFormat(lang).format(date);
        }
      },
      {
        headerName: this.translate.instant('EXPENSES.DESCRIPTION'),
        field: 'description'
      },
      {
        headerName: this.translate.instant('EXPENSES.VALUE'),
        field: 'value',
        valueFormatter: (params: any) => {
          if (params.value == null || params.value === '') return '';
          // Mask/format value as in expenses.component.ts
          return new Intl.NumberFormat(lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(params.value));
        }
      },
      {
        headerName: this.translate.instant('EXPENSES.INSTALLMENTS'),
        field: 'installments',
        valueFormatter: (params: any) => (params.value === undefined || params.value === null || params.value === '') ? '1' : params.value.toString()
      },
      {
        headerName: this.translate.instant('EXPENSES.PLACE'),
        field: 'place'
      },
      {
        headerName: this.translate.instant('EXPENSES.CATEGORY'),
        field: 'category',
        valueFormatter: (params: any) => this.categoriesMap[params.value] || params.value
      },
      {
        headerName: this.translate.instant('EXPENSES.ACCOUNT_USED'),
        field: 'accountUsed',
        valueFormatter: (params: any) => this.accountsMap[params.value] || params.value
      }
    ];
  }
}
