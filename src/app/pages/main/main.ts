import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-main',
  imports: [],
  templateUrl: './main.html',
  styleUrl: './main.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Main {
  private title = inject(Title);
  private meta = inject(Meta);
  private document = inject(DOCUMENT);

  constructor() {
    try {
      this.title.setTitle('Главная — DNS Магазин');
      this.meta.updateTag({
        name: 'description',
        content:
          'DNS магазин электроники: лучшие предложения на смартфоны, ноутбуки и бытовую технику.',
      });
      const origin =
        this.document?.location && this.document.location.origin
          ? this.document.location.origin
          : '';
      let link: HTMLLinkElement | null = this.document.querySelector("link[rel='canonical']");
      if (!link) {
        link = this.document.createElement('link');
        link.setAttribute('rel', 'canonical');
        this.document.head.appendChild(link);
      }
      link.setAttribute('href', origin + '/');
    } catch {
      // ignore on SSR
    }
  }
}
