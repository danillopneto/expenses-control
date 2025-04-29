import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Firestore, collection, addDoc, updateDoc, deleteDoc, doc, collectionData } from '@angular/fire/firestore';
import { Observable, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared.module';
import { FirebaseService } from '../shared/firebase.service';

interface Account {
  id?: string;
  name: string;
}

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss']
})
export class AccountsComponent implements OnInit {
  accountForm: FormGroup;
  accounts$: Observable<Account[]>;
  editingAccount: Account | null = null;

  constructor(private fb: FormBuilder, private firestore: Firestore, private firebaseService: FirebaseService) {
    this.accountForm = this.fb.group({
      name: ['', Validators.required]
    });
    const accountsRef = collection(this.firestore, 'accounts');
    this.accounts$ = collectionData(accountsRef, { idField: 'id' }) as Observable<Account[]>;
    this.accounts$ = this.accounts$.pipe(
      map(accounts => accounts.sort((a, b) => a.name.localeCompare(b.name)))
    );
  }

  ngOnInit(): void {}

  async addAccount() {
    if (this.accountForm.valid) {
      const name = this.accountForm.value.name.trim();
      if (!name) return;
      const accounts = await firstValueFrom(this.accounts$);
      if (accounts && accounts.some(acc => acc.name.toLowerCase() === name.toLowerCase())) {
        alert('Account already exists!');
        return;
      }
      await this.firebaseService.add('accounts', { name });
      this.accountForm.reset();
    }
  }

  editAccount(account: Account) {
    this.editingAccount = { ...account };
    this.accountForm.setValue({ name: account.name });
  }

  async updateAccount() {
    if (this.editingAccount && this.accountForm.valid) {
      await this.firebaseService.update('accounts', this.editingAccount.id!, { name: this.accountForm.value.name });
      this.editingAccount = null;
      this.accountForm.reset();
    }
  }

  async deleteAccount(account: Account) {
    await this.firebaseService.delete('accounts', account.id!);
    if (this.editingAccount?.id === account.id) {
      this.editingAccount = null;
      this.accountForm.reset();
    }
  }

  cancelEdit() {
    this.editingAccount = null;
    this.accountForm.reset();
  }
}
