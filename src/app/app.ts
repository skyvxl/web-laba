import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  effect,
  computed,
} from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from './core/services/auth.service';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, NgOptimizedImage],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly auth = inject(AuthService);
  private router = inject(Router);
  private title = inject(Title);
  private meta = inject(Meta);

  user = toSignal(this.auth.getAuthState(), { initialValue: null });
  initialized = toSignal(this.auth.getInitialized(), { initialValue: false });
  // default light theme for this project is `caramellatte`
  theme = signal<string>('caramellatte');
  avatarUrl = computed(() => {
    const u = this.user();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prefs = (u as any)?.prefs as Record<string, unknown> | undefined;
    const fileId = (prefs && (prefs['avatarFileId'] as string | undefined)) ?? '';
    if (!fileId) return '';
    return this.auth.getAvatarUrl(fileId);
  });
  avatarInitial = computed(() => (this.user()?.name?.[0] ?? '').toUpperCase());

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/']);
  }

  constructor() {
    // set some sane defaults for SEO (will be overridden by page components)
    try {
      this.title.setTitle('DNS - Магазин Электроники');
      this.meta.updateTag({
        name: 'description',
        content:
          'DNS магазин электроники и бытовой техники — широкий ассортимент, выгодные цены и официальная гарантия.',
      });
      this.meta.updateTag({ property: 'og:site_name', content: 'DNS Магазин' });
      this.meta.updateTag({ property: 'og:type', content: 'website' });
    } catch {
      // ignore on server side if unavailable
    }
    // initial theme: prefer stored local value, otherwise user's pref (when available)
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
      if (stored) {
        this.setTheme(stored);
      } else {
        // if user already present, pick their pref
        const u = this.user();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userPref = (u as any)?.prefs?.theme as string | undefined;
        if (userPref) {
          this.setTheme(userPref);
        }
      }
    } catch {
      // ignore
    }

    // react to user logging in and apply their pref
    // Respect local selection: if a local theme is set in localStorage, it takes precedence
    effect(() => {
      const u = this.user();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userPref = (u as any)?.prefs?.theme as string | undefined;
      const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
      // Apply server preference only when there's no local override
      if (!stored && userPref) {
        this.setTheme(userPref);
      }
    });
  }

  private setTheme(name: string) {
    this.theme.set(name);
    try {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', name);
      }
      if (typeof window !== 'undefined') localStorage.setItem('theme', name);
    } catch {
      // ignore
    }
  }

  async toggleTheme() {
    // project uses named themes: 'cosmicburst' (dark) and 'caramellatte' (light)
    const next = this.theme() === 'cosmicburst' ? 'caramellatte' : 'cosmicburst';
    this.setTheme(next);
  }
}
