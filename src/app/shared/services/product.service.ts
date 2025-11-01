import { inject, Injectable } from '@angular/core';
import { collection, Firestore, getDocs } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly firestore: Firestore = inject(Firestore);
  private readonly productsCollection = collection(this.firestore, 'products');

  private products$: Observable<Product[]> | undefined;

  getProducts(): Observable<Product[]> {
    if (!this.products$) {
      this.products$ = from(getDocs(this.productsCollection)).pipe(
        map((snapshot) => {
          return snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
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
          });
        }),
        shareReplay(1),
      );
    }
    return this.products$;
  }
}
