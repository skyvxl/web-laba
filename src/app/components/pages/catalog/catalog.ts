import { Component } from '@angular/core';
import { Product } from '../../../models/product.model';
import { ProductCard } from '../../ui/product-card/product-card';
import { PRODUCTS } from '../../../data/products.data';

@Component({
  selector: 'app-catalog',
  imports: [ProductCard],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
})
export class Catalog {
  products: Product[] = PRODUCTS;
}
