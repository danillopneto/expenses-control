import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, addDoc, query, where, getDocs, CollectionReference, DocumentData, orderBy, Timestamp } from '@angular/fire/firestore';
import { inject } from '@angular/core';
import { SharedModule } from '../shared.module';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { FirebaseService } from '../shared/firebase.service';
import { ColDef } from 'ag-grid-community';
import { AgGridModule } from 'ag-grid-angular';
import { TranslateService } from '@ngx-translate/core';
import { ExpensesFilterComponent } from '../expenses-filter/expenses-filter.component';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { EditExpenseComponent } from '../expenses-edit/edit-expense.component';
import { MatDialog } from '@angular/material/dialog';

interface Expense {
  id: string;
  date?: string | { seconds: number } | Date;
  description?: string;
  value?: number;
  installments?: number;
  place?: string;
  category?: string;
  accountUsed?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-expenses-list',
  standalone: true,
  imports: [SharedModule, CommonModule, MatTableModule, AgGridModule, ExpensesFilterComponent, ReactiveFormsModule, EditExpenseComponent],
  templateUrl: './expenses-list.component.html',
  styleUrls: ['./expenses-list.component.scss']
})
export class ExpensesListComponent implements OnInit {
  expenses: Expense[] = [];
  allExpenses: Expense[] = [];
  loading = true;
  categoriesMap: Record<string, string> = {};
  accountsMap: Record<string, string> = {};
  gridApi: any;
  filter: any = {};
  isTimestampDateField = false;

  // Add default date range for current month
  initialDateFrom: Date;
  initialDateTo: Date;

  columnDefs: ColDef[] = [];
  defaultColDef: ColDef = { resizable: true, sortable: true, filter: true };

  editModalOpen = false;
  editingExpense: Expense | null = null;
  editingExpenseIndex: number = -1;
  editForm: FormGroup | null = null;

  constructor(
    public route: ActivatedRoute,
    private firebaseService: FirebaseService,
    public translate: TranslateService,
    private auth: Auth,
    private firestore: Firestore,
    private fb: FormBuilder,
    private dateAdapter: DateAdapter<Date>,
    private dialog: MatDialog
  ) {
    // Set default range: first day of month to today
    const now = new Date();
    this.initialDateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    this.initialDateTo = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Set initial locale for date adapter
    this.dateAdapter.setLocale(this.translate.currentLang);
    // Update locale on language change
    this.translate.onLangChange.subscribe(event => {
      this.dateAdapter.setLocale(event.lang);
    });
  }

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
    this.allExpenses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Detect if date field is a Firestore Timestamp
    if (this.allExpenses.length > 0) {
      const firstDate = this.allExpenses[0].date;
      this.isTimestampDateField = typeof firstDate === 'object' && firstDate !== null && 'seconds' in firstDate;
    }
    this.expenses = [...this.allExpenses];
    this.loading = false;

    // On load, filter by default date range
    await this.onFilterChange({
      dateFrom: this.initialDateFrom,
      dateTo: this.initialDateTo
    });
  }

  async onDeleteExpense(expense: any) {
    const user = this.auth.currentUser;
    if (!user) return;
    if (!expense.id) return;
    if (!confirm(this.translate.instant('Are you sure you want to delete this expense?'))) return;
    await this.firebaseService.deleteForUser(user.uid, 'expenses', expense.id);
    this.expenses = this.expenses.filter(e => e.id !== expense.id);
  }

  setColumnDefs() {
    const lang = this.translate.currentLang || 'en';
    this.columnDefs = [
      {
        headerName: this.translate.instant('EXPENSES.DATE'),
        field: 'date',
        valueFormatter: (params: any) => {
          if (!params.value) return '';
          let date: Date;
          if (params.value instanceof Timestamp) {
            date = params.value.toDate();
          } else if (typeof params.value === 'object' && params.value?.seconds !== undefined) {
            date = new Date(params.value.seconds * 1000);
          } else {
            date = new Date(params.value);
          }
          if (isNaN(date.getTime())) return params.value;
          return new Intl.DateTimeFormat(lang).format(date);
        }
      },
      {
        headerName: this.translate.instant('EXPENSES.DESCRIPTION'),
        field: 'description',
        flex: 1
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
      },
      {
        headerName: '',
        field: 'actions',
        cellRenderer: (params: any) => `
          <button class="mat-icon-button mat-accent" title="Edit" style="padding:0;min-width:0;background:none;border:none;cursor:pointer;outline:none;" data-action="edit">
            <span class="material-icons" style="color:#1976d2;">edit</span>
          </button>
          <button class="mat-icon-button mat-warn" title="Delete" style="padding:0;min-width:0;background:none;border:none;cursor:pointer;outline:none;" data-action="delete">
            <span class="material-icons" style="color:#f44336;">delete</span>
          </button>
        `,
        width: 100,
        suppressMenu: true,
        sortable: false,
        filter: false,
        cellStyle: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }
      }
    ];
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
  }

  onCellClicked(event: any) {
    if (event.colDef.field === 'actions') {
      const action = event.event?.target?.getAttribute('data-action') || event.event?.target?.parentElement?.getAttribute('data-action');
      if (action === 'edit') {
        this.openEditModal(event.data, event.rowIndex);
      } else if (action === 'delete') {
        this.onDeleteExpense(event.data);
      }
    }
  }

  openEditModal(expense: Expense, index: number) {
    this.editingExpense = { ...expense };
    this.editingExpenseIndex = index;
    // Convert Firestore Timestamp or string to Date for the form
    let dateValue: Date | null = null;
    if (expense.date && typeof expense.date === 'object' && 'seconds' in expense.date) {
      dateValue = new Date((expense.date as { seconds: number }).seconds * 1000);
    } else if (typeof expense.date === 'string') {
      const d = new Date(expense.date);
      dateValue = isNaN(d.getTime()) ? null : d;
    } else if (expense.date instanceof Date) {
      dateValue = expense.date;
    }
    const editForm = this.fb.group({
      date: [dateValue, Validators.required],
      description: [expense.description || '', Validators.required],
      value: [expense.value ?? '', [Validators.required, Validators.pattern(/^[0-9]+(\.[0-9]{1,2})?$/)]],
      installments: [expense.installments ?? 1, [Validators.required, Validators.min(1)]],
      place: [expense.place || ''],
      category: [expense.category || '', Validators.required],
      accountUsed: [expense.accountUsed || '', Validators.required]
    });
    this.dateAdapter.setLocale(this.translate.currentLang);
    const dialogRef = this.dialog.open(EditExpenseComponent, {
      data: {
        editForm,
        categories: this.route.snapshot.data['categories'] || [],
        accounts: this.route.snapshot.data['accounts'] || []
      },
      width: '400px',
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result && result.save) {
        await this.saveEditFromDialog(editForm, expense, index);
      }
    });
  }

  async saveEditFromDialog(editForm: FormGroup, expense: Expense, index: number) {
    if (editForm.invalid) {
      editForm.markAllAsTouched();
      return;
    }
    const user = this.auth.currentUser;
    if (!user) return;
    const formValue = editForm.value;
    let dateToSave: any;
    if (formValue.date instanceof Date) {
      dateToSave = Timestamp.fromDate(formValue.date);
    } else if (typeof formValue.date === 'string') {
      const parsed = this.parseDateByLocale(formValue.date);
      dateToSave = parsed ? Timestamp.fromDate(parsed) : Timestamp.fromDate(new Date());
    } else {
      dateToSave = formValue.date;
    }
    const updatedExpense = {
      ...expense,
      ...formValue,
      date: dateToSave
    };
    await this.firebaseService.updateForUser(user.uid, 'expenses', updatedExpense.id, updatedExpense);
    this.expenses[index] = { ...updatedExpense };
    const allIdx = this.allExpenses.findIndex(e => e.id === updatedExpense.id);
    if (allIdx !== -1) {
      this.allExpenses[allIdx] = { ...updatedExpense };
    }
    this.expenses = [...this.expenses];
  }

  closeEditModal() {
    this.editModalOpen = false;
    this.editingExpense = null;
    this.editingExpenseIndex = -1;
    this.editForm = null;
  }

  parseDateByLocale(dateStr: string): Date | null {
    if (!dateStr) return null;
    const lang = this.translate.currentLang || 'en';
    // Try ISO first
    const iso = Date.parse(dateStr);
    if (!isNaN(iso)) return new Date(iso);
    // pt-BR: dd/MM/yyyy or d/M/yyyy
    if (lang.startsWith('pt')) {
      const match = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const year = parseInt(match[3], 10);
        return new Date(year, month, day);
      }
    }
    // en: MM/dd/yyyy or M/d/yyyy
    if (lang.startsWith('en')) {
      const match = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (match) {
        const month = parseInt(match[1], 10) - 1;
        const day = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);
        return new Date(year, month, day);
      }
    }
    return null;
  }

  async saveEdit() {
    if (!this.editingExpense || this.editingExpenseIndex < 0 || !this.editForm) return;
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const user = this.auth.currentUser;
    if (!user) return;
    const formValue = this.editForm.value;
    let dateToSave: any;
    if (formValue.date instanceof Date) {
      dateToSave = Timestamp.fromDate(formValue.date);
    } else if (typeof formValue.date === 'string') {
      const parsed = this.parseDateByLocale(formValue.date);
      dateToSave = parsed ? Timestamp.fromDate(parsed) : Timestamp.fromDate(new Date());
    } else {
      dateToSave = formValue.date;
    }
    const updatedExpense = {
      ...this.editingExpense,
      ...formValue,
      date: dateToSave
    };
    await this.firebaseService.updateForUser(user.uid, 'expenses', updatedExpense.id, updatedExpense);
    this.expenses[this.editingExpenseIndex] = { ...updatedExpense };
    const allIdx = this.allExpenses.findIndex(e => e.id === updatedExpense.id);
    if (allIdx !== -1) {
      this.allExpenses[allIdx] = { ...updatedExpense };
    }
    this.expenses = [...this.expenses];
    this.closeEditModal();
  }

  async onFilterChange(filter: any) {
    this.filter = filter;
    await this.queryExpensesWithFilter();
  }

  async queryExpensesWithFilter() {
    const user = this.auth.currentUser;
    if (!user) return;
    this.loading = true;
    let expensesRef = collection(this.firestore, `users/${user.uid}/expenses`);
    let q: any = [];
    let dateFrom = this.filter.dateFrom;
    let dateTo = this.filter.dateTo;
    if (dateFrom) {
      q.push(where('date', '>=', Timestamp.fromDate(new Date(dateFrom))));
    }
    if (dateTo) {
      q.push(where('date', '<=', Timestamp.fromDate(new Date(dateTo))));
    }
    if (this.filter.category) {
      q.push(where('category', '==', this.filter.category));
    }
    if (this.filter.accountUsed) {
      q.push(where('accountUsed', '==', this.filter.accountUsed));
    }
    q.push(orderBy('date', 'desc'));
    let queryRef = q.length ? query(expensesRef, ...q) : expensesRef;
    const querySnapshot = await getDocs(queryRef);
    let results: Expense[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (this.filter.description) {
      results = results.filter(e => e.description?.toLowerCase().includes(this.filter.description.toLowerCase()));
    }
    if (this.filter.place) {
      results = results.filter(e => e.place?.toLowerCase().includes(this.filter.place.toLowerCase()));
    }
    this.expenses = results;
    this.loading = false;
  }
}
