import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Category { id: string; name: string; }

@Injectable({ providedIn: 'root' })
export class CategoriesResolver implements Resolve<Observable<Category[]>> {
  constructor(private firestore: Firestore) {}
  resolve() {
    const categoriesRef = collection(this.firestore, 'categories');
    return collectionData(categoriesRef, { idField: 'id' }).pipe(
      map(categories => (categories as Category[]).sort((a, b) => a.name.localeCompare(b.name)))
    );
  }
}
