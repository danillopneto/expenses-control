import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, NgModel, FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc, collectionData } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { SharedModule } from '../shared.module';
import { LoadingService } from '../shared/loading.service';
import { FirebaseService } from '../shared/firebase.service';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AgGridModule } from 'ag-grid-angular';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { DatepickerCellEditor } from '../shared/components/datepicker-cell-editor.component';
import { NumericCellEditor } from '../shared/components/numeric-cell-editor.component';
import { TranslateService } from '@ngx-translate/core';
import { ColDef } from 'ag-grid-community';

interface Category {
  id?: string;
  name: string;
}

interface Account {
  id?: string;
  name: string;
}

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    MatTableModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    AgGridModule,
    DatepickerCellEditor,
    NumericCellEditor
  ],
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent implements OnInit {
  expenseForm: FormGroup;
  categories$: Observable<Category[]> = of([]);
  accounts$: Observable<Account[]> = of([]);
  private expensesSubject = new BehaviorSubject<any[]>([]);
  expenses$: Observable<any[]> = this.expensesSubject.asObservable();
  displayedColumns: string[] = ['date', 'description', 'value', 'installments', 'place', 'category', 'accountUsed', 'actions'];
  categoriesList: Category[] = [];
  accountsList: Account[] = [];
  selectedExpenseIndex = 0;
  gridApi: any;

  columnDefs: ColDef[] = [];
  defaultColDef = { resizable: true, sortable: true };

  @ViewChild('pasteArea') pasteArea!: ElementRef<HTMLTextAreaElement>;

  showPasteArea = false;
  userId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private auth: Auth,
    private firebaseService: FirebaseService,
    public translate: TranslateService
  ) {
    this.expenseForm = this.fb.group({
      date: [null, Validators.required],
      description: ['', Validators.required],
      value: [null, [Validators.required, Validators.pattern(/^[0-9]+(\.[0-9]{1,2})?$/)]],
      place: ['', Validators.required],
      category: ['', Validators.required],
      accountUsed: ['', Validators.required]
    });
  }

  async ngOnInit() {
    const user = this.auth.currentUser;
    this.userId = user ? user.uid : null;
    if (this.userId) {
      const categoriesRef = collection(this.firestore, `users/${this.userId}/categories`);
      this.categories$ = collectionData(categoriesRef, { idField: 'id' }).pipe(
        map(categories => (categories as Category[]).sort((a, b) => a.name.localeCompare(b.name)))
      );
      const accountsRef = collection(this.firestore, `users/${this.userId}/accounts`);
      this.accounts$ = collectionData(accountsRef, { idField: 'id' }).pipe(
        map(accounts => (accounts as Account[]).sort((a, b) => a.name.localeCompare(b.name)))
      );
      this.categories$.subscribe(list => this.categoriesList = list);
      this.accounts$.subscribe(list => this.accountsList = list);
    }
    this.addExpense();
    this.setColumnDefs();
    this.translate.onLangChange.subscribe(() => {
      if (this.gridApi) {
        this.gridApi.refreshCells({ columns: ['date'], force: true });
        this.setColumnDefs();
      }
    });
  }

  setColumnDefs() {
    const defs: ColDef[] = [
      {
        headerName: this.translate.instant('EXPENSES.DATE'),
        field: 'date',
        editable: true,
        cellEditor: DatepickerCellEditor,
        valueFormatter: (params: any) => {
          if (!params.value) return '';
          const lang = this.translate?.currentLang || 'en';
          const date = new Date(params.value);
          if (isNaN(date.getTime())) return params.value;
          return new Intl.DateTimeFormat(lang).format(date);
        }
      },
      { headerName: this.translate.instant('EXPENSES.DESCRIPTION'), field: 'description', editable: true },
      { headerName: this.translate.instant('EXPENSES.VALUE'), field: 'value', editable: true, type: 'numericColumn',
        cellEditor: NumericCellEditor,
        valueParser: (params: any) => {
          const lang = this.translate?.currentLang || 'en';
          let value = params.newValue;
          if (lang === 'pt') {
            value = value.replace(',', '.');
          }
          const num = parseFloat(value);
          return isNaN(num) ? params.oldValue : num;
        },
        valueFormatter: (params: any) => {
          const lang = this.translate?.currentLang || 'en';
          if (params.value == null || params.value === '') return '';
          return new Intl.NumberFormat(lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(params.value);
        }
      },
      { headerName: this.translate.instant('EXPENSES.INSTALLMENTS'), field: 'installments', editable: true, type: 'numericColumn',
        cellEditor: NumericCellEditor,
        valueParser: (params: any) => {
          const val = parseInt(params.newValue, 10);
          return isNaN(val) || val < 1 ? 1 : val;
        },
        valueFormatter: (params: any) => {
          const v = params.value;
          return (v === undefined || v === null || v === '') ? '1' : v.toString();
        }
      },
      { headerName: this.translate.instant('EXPENSES.PLACE'), field: 'place', editable: true },
      { headerName: this.translate.instant('EXPENSES.CATEGORY'), field: 'category', editable: true, cellEditor: 'agSelectCellEditor',
        cellEditorParams: () => ({ values: this.categoriesList.map(c => c.id) }),
        valueFormatter: (params: any) => {
          const match = this.categoriesList.find(c => c.id === params.value);
          return match ? match.name : params.value;
        }
      },
      { headerName: this.translate.instant('EXPENSES.ACCOUNT_USED'), field: 'accountUsed', editable: true, cellEditor: 'agSelectCellEditor',
        cellEditorParams: () => ({ values: this.accountsList.map(a => a.id) }),
        valueFormatter: (params: any) => {
          const match = this.accountsList.find(a => a.id === params.value);
          return match ? match.name : params.value;
        }
      },
      { headerName: '', field: 'actions', cellRenderer: (params: any) => `
        <button class="mat-icon-button mat-warn" data-action="delete" title="Delete" style="padding:0;min-width:0;background:none;border:none;cursor:pointer;outline:none;">
          <span class="material-icons" style="color:#f44336;">delete</span>
        </button>
      `, editable: false }
    ];
    this.columnDefs = defs;
    if (this.gridApi) {
      this.gridApi.setColumnDefs(this.columnDefs);
    }
  }

  get expenses() {
    return this.expensesSubject.value;
  }

  set expenses(val: any[]) {
    this.expensesSubject.next(val);
  }

  isMobile(): boolean {
    return window.innerWidth <= 600;
  }

  prevExpense() {
    if (this.selectedExpenseIndex > 0) {
      this.selectedExpenseIndex--;
    }
  }

  nextExpense() {
    if (this.selectedExpenseIndex < this.expenses.length - 1) {
      this.selectedExpenseIndex++;
    }
  }

  addExpense() {
    const updated = [...this.expenses, {
      date: '',
      description: '',
      value: '',
      installments: 1,
      place: '',
      category: '',
      accountUsed: ''
    }];
    this.expenses = updated;
    this.selectedExpenseIndex = this.expenses.length - 1;
  }

  removeExpense(index: number) {
    const updated = this.expenses.slice();
    updated.splice(index, 1);
    this.expenses = updated;
    if (this.selectedExpenseIndex >= this.expenses.length) {
      this.selectedExpenseIndex = Math.max(0, this.expenses.length - 1);
    }
  }

  async onSubmit() {
    const user = this.auth.currentUser;
    if (!user || this.expenses.length === 0) return;
    // Validate all rows
    const validExpenses = this.expenses.filter(e =>
      e.date && e.description && e.value && e.installments && e.place && e.category && e.accountUsed
    );
    if (validExpenses.length === 0) {
      alert('Please fill in all required fields.');
      return;
    }
    // Prepare expenses for Firebase
    const batch = validExpenses.map(e => ({
      ...e,
      date: typeof e.date === 'string' ? e.date : (e.date instanceof Date ? e.date.toISOString().split('T')[0] : ''),
      value: parseFloat(e.value),
      installments: parseInt(e.installments, 10) || 1,
      uid: user.uid,
      createdAt: new Date().toISOString()
    }));
    try {
      await Promise.all(batch.map(exp => this.firebaseService.addForUser(user.uid, 'expenses', exp)));
      this.expenses = [];
      this.addExpense();
      alert('Expenses added!');
    } catch (err) {
      alert('Error adding expenses.');
    }
  }

  onPaste(event: ClipboardEvent) {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;
    const pastedText = clipboardData.getData('text');
    const rows = pastedText.split(/\r?\n/).filter(row => row.trim() !== '');
    const newExpenses = rows.map(row => {
      const cols = row.split(/\t|,/);
      // Clean value: remove currency, spaces, and convert comma to dot
      let value = (cols[2] || '').replace(/[^\d,.-]/g, '').replace(',', '.').trim();
      if (value.endsWith('.')) value = value.slice(0, -1);
      const categoryName = (cols[5] || '').trim();
      const accountName = (cols[6] || '').trim();
      const categoryObj = this.categoriesList.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
      const accountObj = this.accountsList.find(a => a.name.toLowerCase() === accountName.toLowerCase());
      return {
        date: cols[0] || '',
        description: cols[1] || '',
        value,
        installments: cols[3] ? parseInt(cols[3], 10) || 1 : 1,
        place: cols[4] || '',
        category: categoryObj ? categoryObj.id : '',
        accountUsed: accountObj ? accountObj.id : ''
      };
    });
    this.expenses = [...this.expenses, ...newExpenses];
    event.preventDefault();
  }

  focusPasteArea() {
    setTimeout(() => this.pasteArea?.nativeElement.focus(), 0);
  }

  onCellValueChanged(event: any) {
    // Update the expenses array with the new value
    const updated = [...this.expenses];
    updated[event.rowIndex] = event.data;
    this.expenses = updated;
  }

  onCellClicked(event: any) {
    const target = event.event?.target;
    if (
      event.colDef.field === 'actions' &&
      (target?.getAttribute('data-action') === 'delete' ||
       target?.parentElement?.getAttribute('data-action') === 'delete')
    ) {
      this.removeExpense(event.rowIndex);
    }
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
  }
}
