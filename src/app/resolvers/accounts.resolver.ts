import { Injectable, inject } from '@angular/core';
import { Resolve } from '@angular/router';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Auth } from '@angular/fire/auth';

export interface Account { id: string; name: string; }

@Injectable({ providedIn: 'root' })
export class AccountsResolver implements Resolve<Observable<Account[]>> {
  private auth = inject(Auth);
  constructor(private firestore: Firestore) {}
  resolve() {
    const user = this.auth.currentUser;
    if (!user) return new Observable<Account[]>(observer => { observer.next([]); observer.complete(); });
    const accountsRef = collection(this.firestore, `users/${user.uid}/accounts`);
    return collectionData(accountsRef, { idField: 'id' }).pipe(
      map(accounts => (accounts as Account[]).sort((a, b) => a.name.localeCompare(b.name)))
    );
  }
}
