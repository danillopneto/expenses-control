import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, CollectionReference, DocumentData } from '@angular/fire/firestore';
import { LoadingService } from './loading.service';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  constructor(private firestore: Firestore, private loadingService: LoadingService) {}

  // User-scoped subcollection helpers
  private userSubcollection(userId: string, sub: string) {
    return collection(this.firestore, `users/${userId}/${sub}`);
  }

  async addForUser(userId: string, sub: string, data: any) {
    this.loadingService.show();
    try {
      return await addDoc(this.userSubcollection(userId, sub), data);
    } finally {
      this.loadingService.hide();
    }
  }

  async updateForUser(userId: string, sub: string, id: string, data: any) {
    this.loadingService.show();
    try {
      const ref = doc(this.firestore, `users/${userId}/${sub}/${id}`);
      return await updateDoc(ref, data);
    } finally {
      this.loadingService.hide();
    }
  }

  async deleteForUser(userId: string, sub: string, id: string) {
    this.loadingService.show();
    try {
      const ref = doc(this.firestore, `users/${userId}/${sub}/${id}`);
      return await deleteDoc(ref);
    } finally {
      this.loadingService.hide();
    }
  }

  async getAllForUser(userId: string, sub: string) {
    this.loadingService.show();
    try {
      const ref = this.userSubcollection(userId, sub) as CollectionReference<DocumentData>;
      return await getDocs(ref);
    } finally {
      this.loadingService.hide();
    }
  }
}
