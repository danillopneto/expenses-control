import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Firestore, collection, addDoc, collectionData } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SharedModule } from '../shared.module';

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
    SharedModule
  ],
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent implements OnInit {
  expenseForm: FormGroup;
  categories$: Observable<Category[]>;
  accounts$: Observable<Account[]>;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private auth: Auth
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
  }

  ngOnInit(): void {}

  async onSubmit() {
    if (this.expenseForm.valid) {
      const user = this.auth.currentUser;
      if (!user) return;
      const formValue = this.expenseForm.value;
      const expense = {
        ...formValue,
        date: formValue.date instanceof Date ? formValue.date.toISOString().split('T')[0] : formValue.date,
        value: parseFloat(formValue.value),
        uid: user.uid,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(this.firestore, 'expenses'), expense);
      this.expenseForm.reset();
      alert('Expense added!');
    }
  }
}
