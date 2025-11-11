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

  themeStatus = signal<string>('');
  avatarStatus = signal<string>('');
  uploadingAvatar = signal<boolean>(false);
  avatarUrl = computed(() => {
    const u = this.user();
    const prefs = (u?.prefs ?? {}) as Record<string, unknown>;
    const fileId = (prefs['avatarFileId'] as string | undefined) ?? '';
    if (!fileId) return '';
    return this.auth.getAvatarUrl(fileId);
  });

  uid = computed(() => this.user()?.$id ?? '—');
  email = computed(() => this.user()?.email ?? '—');
  name = computed(() => this.user()?.name ?? '—');
  phone = computed(() => this.user()?.phone ?? '—');
  creation = computed(() => formatDt(this.user()?.$createdAt));
  lastLogin = computed(() => formatDt(this.user()?.accessedAt));

  // Settings form
  newEmail = signal<string>('');
  emailPassword = signal<string>(''); // Password required for email change
  newPassword = signal<string>('');
  oldPassword = signal<string>('');
  settingsStatus = signal<string>('');

  onNewEmailChange(value: string) {
    this.newEmail.set(value);
  }

  onEmailPasswordChange(value: string) {
    this.emailPassword.set(value);
  }

  onOldPasswordChange(value: string) {
    this.oldPassword.set(value);
  }

  onNewPasswordChange(value: string) {
    this.newPassword.set(value);
  }

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
      this.themeStatus.set('Сохранено');
      setTimeout(() => this.themeStatus.set(''), 2000);
    } catch (err) {
      console.warn('Failed to save theme preference', err);
      this.themeStatus.set('Ошибка');
      setTimeout(() => this.themeStatus.set(''), 3000);
    }
  }

  async onAvatarFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input || !input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.uploadingAvatar.set(true);
    try {
      // Check if user already has an avatar and delete it first
      const u = this.user();
      const prefs = (u?.prefs ?? {}) as Record<string, unknown>;
      const existingFileId = (prefs['avatarFileId'] as string | undefined) ?? '';

      if (existingFileId) {
        // Delete old avatar before uploading new one
        await this.auth.deleteAvatar(existingFileId);
      }

      // Upload new avatar
      await this.auth.uploadAvatar(file);
      this.avatarStatus.set('Аватар загружен');
      setTimeout(() => this.avatarStatus.set(''), 2000);
    } catch (err) {
      console.warn('Failed to upload avatar', err);
      this.avatarStatus.set('Ошибка загрузки');
      setTimeout(() => this.avatarStatus.set(''), 3000);
    } finally {
      this.uploadingAvatar.set(false);
      // clear input
      input.value = '';
    }
  }

  async removeAvatar() {
    const u = this.user();
    const prefs = (u?.prefs ?? {}) as Record<string, unknown>;
    const avatarFileId = (prefs['avatarFileId'] as string | undefined) ?? '';
    if (!avatarFileId) return;
    try {
      await this.auth.deleteAvatar(avatarFileId);
      this.avatarStatus.set('Аватар удален');
      setTimeout(() => this.avatarStatus.set(''), 2000);
    } catch (err) {
      console.warn('Failed to delete avatar', err);
      this.avatarStatus.set('Ошибка удаления');
      setTimeout(() => this.avatarStatus.set(''), 3000);
    }
  }

  async changeEmail() {
    const email = this.newEmail().trim();
    const password = this.emailPassword().trim();
    if (!email || !password) return;
    try {
      await this.auth.updateEmail(email, password);
      this.settingsStatus.set('Сохранено');
      setTimeout(() => this.settingsStatus.set(''), 2000);
    } catch {
      this.settingsStatus.set('Ошибка');
      setTimeout(() => this.settingsStatus.set(''), 2000);
    }
  }

  async changePassword() {
    const newPass = this.newPassword();
    const oldPass = this.oldPassword();
    if (!newPass || !oldPass) return;
    try {
      await this.auth.updatePassword(newPass, oldPass);
      this.settingsStatus.set('Сохранено');
      setTimeout(() => this.settingsStatus.set(''), 2000);
    } catch {
      this.settingsStatus.set('Ошибка');
      setTimeout(() => this.settingsStatus.set(''), 2000);
    }
  }

  applyLocalTheme(theme: string) {
    this.selectedTheme.set(theme);
    try {
      if (typeof document !== 'undefined')
        document.documentElement.setAttribute('data-theme', theme);
      if (typeof window !== 'undefined') localStorage.setItem('theme', theme);
    } catch {
      // ignore
    }
  }
}

function formatDt(dt: string | null | undefined): string {
  if (!dt) return '—';
  const d = new Date(dt);
  if (isNaN(d.getTime())) return dt;
  return d.toLocaleString('ru-RU');
}
