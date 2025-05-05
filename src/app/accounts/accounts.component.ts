import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable, of, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared.module';
import { FirebaseService } from '../shared/firebase.service';
import { Auth } from '@angular/fire/auth';

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
  accounts$: Observable<Account[]> = of([]);
  editingAccount: Account | null = null;
  private auth = inject(Auth);
  userId: string | null = null;

  constructor(private fb: FormBuilder, private firestore: Firestore, private firebaseService: FirebaseService) {
    this.accountForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

  async ngOnInit() {
    const user = this.auth.currentUser;
    this.userId = user ? user.uid : null;
    if (this.userId) {
      const accountsRef = collection(this.firestore, `users/${this.userId}/accounts`);
      this.accounts$ = collectionData(accountsRef, { idField: 'id' }) as Observable<Account[]>;
      this.accounts$ = this.accounts$.pipe(
        map(accounts => accounts.sort((a, b) => a.name.localeCompare(b.name)))
      );
    }
  }

  async addAccount() {
    if (this.accountForm.valid && this.userId) {
      const name = this.accountForm.value.name.trim();
      if (!name) return;
      const accounts = await firstValueFrom(this.accounts$);
      if (accounts && accounts.some(acc => acc.name.toLowerCase() === name.toLowerCase())) {
        alert('Account already exists!');
        return;
      }
      await this.firebaseService.addForUser(this.userId, 'accounts', { name });
      this.accountForm.reset();
    }
  }

  editAccount(account: Account) {
    this.editingAccount = { ...account };
    this.accountForm.setValue({ name: account.name });
  }

  async updateAccount() {
    if (this.editingAccount && this.accountForm.valid && this.userId) {
      await this.firebaseService.updateForUser(this.userId, 'accounts', this.editingAccount.id!, { name: this.accountForm.value.name });
      this.editingAccount = null;
      this.accountForm.reset();
    }
  }

  async deleteAccount(account: Account) {
    if (this.userId) {
      await this.firebaseService.deleteForUser(this.userId, 'accounts', account.id!);
      if (this.editingAccount?.id === account.id) {
        this.editingAccount = null;
        this.accountForm.reset();
      }
    }
  }

  cancelEdit() {
    this.editingAccount = null;
    this.accountForm.reset();
  }
}
