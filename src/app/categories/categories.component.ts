import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Firestore, collection, addDoc, updateDoc, deleteDoc, doc, collectionData, DocumentReference } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared.module';
import { map } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { FirebaseService } from '../shared/firebase.service';
import { Auth } from '@angular/fire/auth';

interface Category {
  id?: string;
  name: string;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {
  categoryForm: FormGroup;
  categories$: Observable<Category[]> = of([]);
  editingCategory: Category | null = null;
  private auth = inject(Auth);
  userId: string | null = null;

  constructor(private fb: FormBuilder, private firestore: Firestore, private firebaseService: FirebaseService) {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

  async ngOnInit() {
    const user = this.auth.currentUser;
    this.userId = user ? user.uid : null;
    if (this.userId) {
      const categoriesRef = collection(this.firestore, `users/${this.userId}/categories`);
      this.categories$ = collectionData(categoriesRef, { idField: 'id' }) as Observable<Category[]>;
      this.categories$ = this.categories$.pipe(
        map(categories => categories.sort((a, b) => a.name.localeCompare(b.name)))
      );
    }
  }

  async addCategory() {
    if (this.categoryForm.valid && this.userId) {
      const name = this.categoryForm.value.name.trim();
      if (!name) return;
      const categories = await firstValueFrom(this.categories$);
      if (categories && categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
        alert('Category already exists!');
        return;
      }
      await this.firebaseService.addForUser(this.userId, 'categories', { name });
      this.categoryForm.reset();
    }
  }

  editCategory(category: Category) {
    this.editingCategory = { ...category };
    this.categoryForm.setValue({ name: category.name });
  }

  async updateCategory() {
    if (this.editingCategory && this.categoryForm.valid && this.userId) {
      await this.firebaseService.updateForUser(this.userId, 'categories', this.editingCategory.id!, { name: this.categoryForm.value.name });
      this.editingCategory = null;
      this.categoryForm.reset();
    }
  }

  async deleteCategory(category: Category) {
    if (this.userId) {
      await this.firebaseService.deleteForUser(this.userId, 'categories', category.id!);
      if (this.editingCategory?.id === category.id) {
        this.editingCategory = null;
        this.categoryForm.reset();
      }
    }
  }

  cancelEdit() {
    this.editingCategory = null;
    this.categoryForm.reset();
  }
}
