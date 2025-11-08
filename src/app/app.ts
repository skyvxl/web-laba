import { ChangeDetectionStrategy, Component, inject, signal, effect } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly auth = inject(AuthService);
  private router = inject(Router);

  user = toSignal(this.auth.getAuthState(), { initialValue: null });
  initialized = toSignal(this.auth.getInitialized(), { initialValue: false });
  // default light theme for this project is `caramellatte`
  theme = signal<string>('caramellatte');

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/']);
  }

  constructor() {
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
    effect(() => {
      const u = this.user();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userPref = (u as any)?.prefs?.theme as string | undefined;
      if (userPref) {
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
    // persist to user prefs if logged in
    try {
      const u = this.user();
      if (u) {
        await this.auth.setPreferences({ theme: next });
      }
    } catch {
      // ignore
    }
  }
}
