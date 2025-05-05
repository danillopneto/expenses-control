import { Injectable, inject } from '@angular/core';
import { Resolve } from '@angular/router';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Auth } from '@angular/fire/auth';

export interface Category { id: string; name: string; }

@Injectable({ providedIn: 'root' })
export class CategoriesResolver implements Resolve<Observable<Category[]>> {
  private auth = inject(Auth);
  constructor(private firestore: Firestore) {}
  resolve() {
    const user = this.auth.currentUser;
    if (!user) return new Observable<Category[]>(observer => { observer.next([]); observer.complete(); });
    const categoriesRef = collection(this.firestore, `users/${user.uid}/categories`);
    return collectionData(categoriesRef, { idField: 'id' }).pipe(
      map(categories => (categories as Category[]).sort((a, b) => a.name.localeCompare(b.name)))
    );
  }
}
