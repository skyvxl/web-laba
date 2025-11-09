import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../../shared/models/product.model';
import { KeyValuePipe, DOCUMENT, NgOptimizedImage } from '@angular/common';
import { ProductService } from '../../shared/services/product.service';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-product',
  imports: [KeyValuePipe, NgOptimizedImage],
  templateUrl: './product.html',
  styleUrl: './product.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductPage implements OnInit {
  product = signal<Product | null>(null);
  jsonLd = signal<string>('');

  private title = inject(Title);
  private meta = inject(Meta);
  private document = inject(DOCUMENT);

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

        // SEO: set title & meta tags (rendered on server via SSR)
        const titleText = `${foundProduct.name} — DNS Магазин`;
        const description =
          foundProduct.shortDescription || (foundProduct.description || '').slice(0, 160);
        const origin =
          this.document?.location && this.document.location.origin
            ? this.document.location.origin
            : '';
        try {
          this.title.setTitle(titleText);
          this.meta.updateTag({ name: 'description', content: description });
          this.meta.updateTag({ property: 'og:title', content: titleText });
          this.meta.updateTag({ property: 'og:description', content: description });
          this.meta.updateTag({ property: 'og:image', content: foundProduct.image });
          this.meta.updateTag({ property: 'og:type', content: 'product' });
          this.meta.updateTag({
            property: 'og:url',
            content: origin + '/product/' + foundProduct.id,
          });
          this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
          this.meta.updateTag({ name: 'twitter:title', content: titleText });
          this.meta.updateTag({ name: 'twitter:description', content: description });
          this.meta.updateTag({ name: 'twitter:image', content: foundProduct.image });
        } catch {
          // ignore on server if Meta API not available
        }

        // canonical link
        try {
          const origin =
            this.document?.location && this.document.location.origin
              ? this.document.location.origin
              : '';
          const canonicalHref = origin + '/product/' + foundProduct.id;
          let link: HTMLLinkElement | null = this.document.querySelector("link[rel='canonical']");
          if (!link) {
            link = this.document.createElement('link');
            link.setAttribute('rel', 'canonical');
            this.document.head.appendChild(link);
          }
          link.setAttribute('href', canonicalHref);
        } catch {
          // ignore
        }

        // JSON-LD structured data for product
        try {
          const json = {
            '@context': 'https://schema.org/',
            '@type': 'Product',
            name: foundProduct.name,
            image: [foundProduct.image],
            description: foundProduct.shortDescription || foundProduct.description,
            sku: foundProduct.id,
            brand: {
              '@type': 'Brand',
              name: 'DNS',
            },
            offers: {
              '@type': 'Offer',
              url: (this.document?.location?.origin ?? '') + '/product/' + foundProduct.id,
              priceCurrency: 'RUB',
              price: String(foundProduct.price),
              availability: 'http://schema.org/InStock',
            },
          };
          this.jsonLd.set(JSON.stringify(json, null, 2));
        } catch {
          // ignore
        }
      } else {
        this.router.navigate(['/404']);
      }
    });
  }
}
