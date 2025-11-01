import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  DocumentData,
  onSnapshot,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';

const productConverter: FirestoreDataConverter<Product> = {
  toFirestore: (product: Product): DocumentData => {
    const { ...data } = product;
    return data;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Product => {
    const data = snapshot.data(options);
    return {
      id: parseInt(snapshot.id, 10),
      name: data['name'],
      category: data['category'],
      price: data['price'],
      oldPrice: data['oldPrice'],
      image: data['image'],
      shortDescription: data['shortDescription'],
      description: data['description'],
      characteristics: data['characteristics'],
      features: data['features'],
    } as Product;
  },
};

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly firestore: Firestore = inject(Firestore);

  private readonly productsCollection = collection(this.firestore, 'products').withConverter(
    productConverter,
  );

  getProducts(): Observable<Product[]> {
    const q = query(this.productsCollection);

    return new Observable((subscriber) => {
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const products: Product[] = [];
          querySnapshot.forEach((doc) => {
            products.push(doc.data());
          });
          subscriber.next(products);
        },
        (error) => {
          subscriber.error(error);
        },
      );

      return () => unsubscribe();
    });
  }
}
