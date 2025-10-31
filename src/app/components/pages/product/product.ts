import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../../../models/product.model';
import { PRODUCTS } from '../../../data/products.data';
import { KeyValuePipe, NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-product',
  imports: [KeyValuePipe, NgOptimizedImage],
  templateUrl: './product.html',
  styleUrl: './product.css',
})
export class ProductPage implements OnInit {
  product = signal<Product | null>(null);

  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const foundProduct = PRODUCTS.find((p) => p.id === id);

    if (foundProduct) {
      this.product.set(foundProduct);
    } else {
      this.router.navigate(['/404']);
    }
  }
}
