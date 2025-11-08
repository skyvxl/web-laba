import { inject, Injectable, PLATFORM_ID, TransferState, makeStateKey } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import { Product } from '../models/product.model';
import { isPlatformBrowser } from '@angular/common';
import { databases } from '../../core/config/appwrite';
import { environment } from '../../../environments/environment';
import type { Models } from 'appwrite';

const PRODUCTS_KEY = makeStateKey<Product[]>('products');

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly transferState = inject(TransferState);
  private readonly platformId = inject(PLATFORM_ID);

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
        this.products$ = from(
          databases.listDocuments(
            environment.appwriteDatabaseId,
            environment.appwriteProductsCollectionId,
          ),
        ).pipe(
          map((response) => {
            return response.documents.map((doc: Models.Document) => {
              const data = doc as unknown as Record<string, unknown>;

              // Парсим characteristics если это строка JSON
              let characteristics: Record<string, string> = {};
              if (typeof data['characteristics'] === 'string') {
                try {
                  characteristics = JSON.parse(data['characteristics'] as string);
                } catch (e) {
                  console.warn('Failed to parse characteristics for product:', doc.$id, e);
                  characteristics = {};
                }
              } else if (typeof data['characteristics'] === 'object') {
                characteristics = data['characteristics'] as Record<string, string>;
              }

              // Парсим features если это строка JSON
              let features: string[] = [];
              if (typeof data['features'] === 'string') {
                try {
                  features = JSON.parse(data['features'] as string);
                } catch (e) {
                  console.warn('Failed to parse features for product:', doc.$id, e);
                  features = [];
                }
              } else if (Array.isArray(data['features'])) {
                features = data['features'] as string[];
              }

              return {
                id: doc.$id,
                name: data['name'] as string,
                category: data['category'] as string,
                price: data['price'] as number,
                oldPrice: data['oldPrice'] as number | undefined,
                image: data['image'] as string,
                shortDescription: data['shortDescription'] as string,
                description: data['description'] as string,
                characteristics,
                features,
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
