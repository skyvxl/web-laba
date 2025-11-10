import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  effect,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-page',
  imports: [],
  templateUrl: './user.html',
  styleUrl: './user.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserPage {
  private readonly auth = inject(AuthService);
  private router: Router = inject(Router);

  user = toSignal(this.auth.getAuthState(), { initialValue: null });

  // Theme selection for saving preference
  selectedTheme = signal<string>('caramellatte');

  saveStatus = signal<string>('');

  uid = computed(() => this.user()?.$id ?? '—');
  email = computed(() => this.user()?.email ?? '—');
  name = computed(() => this.user()?.name ?? '—');
  phone = computed(() => this.user()?.phone ?? '—');
  creation = computed(() => formatDt(this.user()?.$createdAt));
  lastLogin = computed(() => formatDt(this.user()?.accessedAt));

  async logout() {
    await this.auth.logout();
    await this.router.navigate(['/']);
  }

  constructor() {
    // react to user changes and localStorage to initialize selectedTheme
    effect(() => {
      const u = this.user();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userPref = (u as any)?.prefs?.theme as string | undefined;
      if (userPref) {
        this.selectedTheme.set(userPref);
        return;
      }
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('theme');
        if (stored) this.selectedTheme.set(stored);
      }
    });
  }

  async saveThemePreference() {
    const theme = this.selectedTheme();
    try {
      await this.auth.setPreferences({ theme });
      // apply locally as well
      try {
        if (typeof document !== 'undefined')
          document.documentElement.setAttribute('data-theme', theme);
        if (typeof window !== 'undefined') localStorage.setItem('theme', theme);
      } catch {
        // ignore
      }
      this.saveStatus.set('Сохранено');
      setTimeout(() => this.saveStatus.set(''), 2000);
    } catch (err) {
      console.warn('Failed to save theme preference', err);
      this.saveStatus.set('Ошибка');
      setTimeout(() => this.saveStatus.set(''), 3000);
    }
  }
}

function formatDt(dt: string | null | undefined): string {
  if (!dt) return '—';
  const d = new Date(dt);
  if (isNaN(d.getTime())) return dt;
  return d.toLocaleString('ru-RU');
}
