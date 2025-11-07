import {
  inject,
  Injectable,
  PLATFORM_ID,
  TransferState,
  makeStateKey,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import { collection, Firestore, getDocs } from '@angular/fire/firestore';
import { from, Observable, of, defer } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import { Product } from '../models/product.model';
import { isPlatformBrowser } from '@angular/common';

const PRODUCTS_KEY = makeStateKey<Product[]>('products');

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly firestore: Firestore = inject(Firestore);
  private readonly transferState = inject(TransferState);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(Injector);
  private readonly productsCollection = collection(this.firestore, 'products');

  private products$: Observable<Product[]> | undefined;

  getProducts(): Observable<Product[]> {
    if (!this.products$) {
      const cachedProducts = this.transferState.get(PRODUCTS_KEY, null);

      if (cachedProducts) {
        this.products$ = of(cachedProducts);
        if (isPlatformBrowser(this.platformId)) {
          this.transferState.remove(PRODUCTS_KEY);
        }
      } else {
        this.products$ = defer(() =>
          runInInjectionContext(this.injector, () => from(getDocs(this.productsCollection))),
        ).pipe(
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
          tap((products) => {
            if (!isPlatformBrowser(this.platformId)) {
              this.transferState.set(PRODUCTS_KEY, products);
            }
          }),
          shareReplay(1),
        );
      }
    }
    return this.products$;
  }
}
