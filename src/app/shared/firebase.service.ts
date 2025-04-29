import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, CollectionReference, DocumentData } from '@angular/fire/firestore';
import { LoadingService } from './loading.service';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  constructor(private firestore: Firestore, private loadingService: LoadingService) {}

  async add(collectionName: string, data: any) {
    this.loadingService.show();
    try {
      return await addDoc(collection(this.firestore, collectionName), data);
    } finally {
      this.loadingService.hide();
    }
  }

  async update(collectionName: string, id: string, data: any) {
    this.loadingService.show();
    try {
      const ref = doc(this.firestore, collectionName, id);
      return await updateDoc(ref, data);
    } finally {
      this.loadingService.hide();
    }
  }

  async delete(collectionName: string, id: string) {
    this.loadingService.show();
    try {
      const ref = doc(this.firestore, collectionName, id);
      return await deleteDoc(ref);
    } finally {
      this.loadingService.hide();
    }
  }

  async getWhere(collectionName: string, field: string, op: any, value: any) {
    this.loadingService.show();
    try {
      const ref = collection(this.firestore, collectionName) as CollectionReference<DocumentData>;
      const q = query(ref, where(field, op, value));
      return await getDocs(q);
    } finally {
      this.loadingService.hide();
    }
  }
}
