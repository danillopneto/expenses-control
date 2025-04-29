import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, addDoc, query, where, getDocs, CollectionReference, DocumentData } from '@angular/fire/firestore';
import { inject } from '@angular/core';
import { SharedModule } from '../shared.module';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-expenses-list',
  standalone: true,
  imports: [SharedModule, CommonModule, MatTableModule],
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

  constructor(private route: ActivatedRoute) {
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

    const expensesRef = collection(this.firestore, 'expenses') as CollectionReference<DocumentData>;
    const q = query(expensesRef, where('uid', '==', user.uid));
    const querySnapshot = await getDocs(q);
    this.expenses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    this.loading = false;
  }
}
