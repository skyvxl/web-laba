import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../../shared/models/product.model';
import { KeyValuePipe } from '@angular/common';
import { ProductService } from '../../shared/services/product.service';

@Component({
  selector: 'app-product',
  imports: [KeyValuePipe],
  templateUrl: './product.html',
  styleUrl: './product.css',
})
export class ProductPage implements OnInit {
  product = signal<Product | null>(null);

  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private productService: ProductService = inject(ProductService);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/404']);
      return;
    }

    this.productService.getProducts().subscribe((products) => {
      const foundProduct = products.find((p) => p.id === id);
      if (foundProduct) {
        this.product.set(foundProduct);
      } else {
        this.router.navigate(['/404']);
      }
    });
  }
}
