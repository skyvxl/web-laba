import { Component, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-consent',
  standalone: true,
  templateUrl: './consent.html',
})
export class ConsentPage {
  private title = inject(Title);
  private meta = inject(Meta);
  private document = inject(DOCUMENT);

  constructor() {
    try {
      this.title.setTitle('Согласие на обработку данных — DNS');
      this.meta.updateTag({
        name: 'description',
        content: 'Согласие на обработку персональных данных для клиентов DNS.',
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
      link.setAttribute('href', origin + '/consent');
    } catch {
      // ignore on SSR
    }
  }
}
