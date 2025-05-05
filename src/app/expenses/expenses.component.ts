import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, NgModel, FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc, collectionData } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, BehaviorSubject } from 'rxjs';
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
    FormsModule
  ],
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent implements OnInit {
  expenseForm: FormGroup;
  categories$: Observable<Category[]>;
  accounts$: Observable<Account[]>;
  private expensesSubject = new BehaviorSubject<any[]>([]);
  expenses$: Observable<any[]> = this.expensesSubject.asObservable();
  displayedColumns: string[] = ['date', 'description', 'value', 'place', 'category', 'accountUsed', 'actions'];
  categoriesList: Category[] = [];
  accountsList: Account[] = [];
  selectedExpenseIndex = 0;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private auth: Auth,
    private firebaseService: FirebaseService
  ) {
    this.expenseForm = this.fb.group({
      date: [null, Validators.required],
      description: ['', Validators.required],
      value: [null, [Validators.required, Validators.pattern(/^[0-9]+(\.[0-9]{1,2})?$/)]],
      place: ['', Validators.required],
      category: ['', Validators.required],
      accountUsed: ['', Validators.required]
    });

    // Fetch categories from Firestore
    const categoriesRef = collection(this.firestore, 'categories');
    this.categories$ = collectionData(categoriesRef, { idField: 'id' }).pipe(
      map(categories => (categories as Category[]).sort((a, b) => a.name.localeCompare(b.name)))
    );

    // Fetch accounts from Firestore
    const accountsRef = collection(this.firestore, 'accounts');
    this.accounts$ = collectionData(accountsRef, { idField: 'id' }).pipe(
      map(accounts => (accounts as Account[]).sort((a, b) => a.name.localeCompare(b.name)))
    );

    this.categories$.subscribe(list => this.categoriesList = list);
    this.accounts$.subscribe(list => this.accountsList = list);
  }

  ngOnInit(): void {
    // Optionally, start with one empty row
    this.addExpense();
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
      e.date && e.description && e.value && e.place && e.category && e.accountUsed
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
      uid: user.uid,
      createdAt: new Date().toISOString()
    }));
    try {
      await Promise.all(batch.map(exp => this.firebaseService.add('expenses', exp)));
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
      const cols = row.split(/\t|,/); // Support tab or comma separated
      // Map category and account names to IDs
      const categoryName = (cols[4] || '').trim();
      const accountName = (cols[5] || '').trim();
      const categoryObj = this.categoriesList.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
      const accountObj = this.accountsList.find(a => a.name.toLowerCase() === accountName.toLowerCase());
      return {
        date: cols[0] || '',
        description: cols[1] || '',
        value: cols[2] || '',
        place: cols[3] || '',
        category: categoryObj ? categoryObj.id : '',
        accountUsed: accountObj ? accountObj.id : ''
      };
    });
    this.expenses = [...this.expenses, ...newExpenses]; // trigger table update
    event.preventDefault();
  }
}
