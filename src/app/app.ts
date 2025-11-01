import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { BaseInput } from './shared/components/base-input/base-input';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, BaseInput],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly auth = inject(AuthService);

  email = signal('');
  password = signal('');
  loading = signal(false);
  errorMsg = signal<string | null>(null);

  user = toSignal(this.auth.getAuthState(), { initialValue: null });

  private router = inject(Router);

  onEmailChange(v: string) {
    this.email.set(v);
    this.errorMsg.set(null);
  }

  onPasswordChange(v: string) {
    this.password.set(v);
    this.errorMsg.set(null);
  }

  async login() {
    if (this.loading()) return;
    const email = this.email().trim();
    const password = this.password();
    if (!email || !password) {
      this.errorMsg.set('Введите логин и пароль');
      return;
    }
    try {
      this.loading.set(true);
      await this.auth.login(email, password);
      this.errorMsg.set(null);
      // очистим пароль из памяти
      this.password.set('');
      this.router.navigate(['/']);
    } catch (e) {
      this.errorMsg.set(mapLoginError(e));
    } finally {
      this.loading.set(false);
    }
  }
}

function mapLoginError(e: unknown): string {
  const code = (e as { code?: string } | null | undefined)?.code;
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Неверный e-mail или пароль';
    case 'auth/invalid-email':
      return 'Некорректный e-mail';
    case 'auth/too-many-requests':
      return 'Слишком много попыток. Попробуйте позже';
    default:
      return 'Не удалось войти. Попробуйте ещё раз';
  }
}
