import { Component, inject } from '@angular/core';
import { Product } from '../../shared/models/product.model';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { ProductService } from '../../shared/services/product.service';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-catalog',
  imports: [ProductCard, AsyncPipe],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
})
export class Catalog {
  private readonly productService: ProductService = inject(ProductService);
  products$: Observable<Product[]> = this.productService.getProducts();
}
