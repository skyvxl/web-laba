import { Component, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-privacy',
  standalone: true,
  templateUrl: './privacy.html',
})
export class PrivacyPage {
  private title = inject(Title);
  private meta = inject(Meta);
  private document = inject(DOCUMENT);

  constructor() {
    try {
      this.title.setTitle('Политика конфиденциальности — DNS');
      this.meta.updateTag({
        name: 'description',
        content: 'Политика конфиденциальности DNS: как мы обрабатываем персональные данные.',
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
      link.setAttribute('href', origin + '/privacy');
    } catch {
      // ignore on SSR
    }
  }
}
