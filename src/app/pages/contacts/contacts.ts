import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BaseInput } from '../../shared/components/base-input/base-input';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-contacts',
  imports: [BaseInput],
  templateUrl: './contacts.html',
  styleUrl: './contacts.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contacts {
  private title = inject(Title);
  private meta = inject(Meta);
  private document = inject(DOCUMENT);

  constructor() {
    try {
      this.title.setTitle('Контакты — DNS Магазин');
      this.meta.updateTag({
        name: 'description',
        content: 'Контактные данные DNS, обращения в службу поддержки и реквизиты.',
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
      link.setAttribute('href', origin + '/contacts');
    } catch {
      // ignore on SSR
    }
  }
}
