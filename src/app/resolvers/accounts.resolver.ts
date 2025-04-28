import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Account { id: string; name: string; }

@Injectable({ providedIn: 'root' })
export class AccountsResolver implements Resolve<Observable<Account[]>> {
  constructor(private firestore: Firestore) {}
  resolve() {
    const accountsRef = collection(this.firestore, 'accounts');
    return collectionData(accountsRef, { idField: 'id' }).pipe(
      map(accounts => (accounts as Account[]).sort((a, b) => a.name.localeCompare(b.name)))
    );
  }
}
