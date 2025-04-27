import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.css'
})
export class ExpensesComponent {
  expenseForm: FormGroup;
  firestore: Firestore;
  auth: Auth;
  categories = ['Food', 'Transport', 'Utilities', 'Health', 'Entertainment', 'Other'];
  accounts = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Other'];

  constructor(private fb: FormBuilder) {
    this.firestore = inject(Firestore);
    this.auth = inject(Auth);
    this.expenseForm = this.fb.group({
      date: [null, Validators.required], // Date type
      description: ['', Validators.required],
      value: [null, [Validators.required, Validators.pattern(/^[0-9]+(\.[0-9]{1,2})?$/)]], // Number type
      place: ['', Validators.required],
      category: ['', Validators.required],
      accountUsed: ['', Validators.required]
    });
  }

  onSubmit() {
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
      addDoc(collection(this.firestore, 'expenses'), expense)
        .then(() => {
          this.expenseForm.reset();
          alert('Expense added!');
        })
        .catch(err => alert('Error adding expense: ' + err));
    }
  }
}
