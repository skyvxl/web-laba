import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  loading = signal(false);
  errorMsg = signal<string | null>(null);
  success = signal(false);

  onEmailChange(value: string) {
    const c = this.form.get('email');
    c?.setValue(value);
    c?.markAsDirty();
    c?.markAsTouched();
    this.errorMsg.set(null);
  }

  onPasswordChange(value: string) {
    const c = this.form.get('password');
    c?.setValue(value);
    c?.markAsDirty();
    c?.markAsTouched();
    this.errorMsg.set(null);
  }

  onConfirmPasswordChange(value: string) {
    const c = this.form.get('confirmPassword');
    c?.setValue(value);
    c?.markAsDirty();
    c?.markAsTouched();
    this.errorMsg.set(null);
  }

  async submit() {
    if (this.loading()) return;
    this.errorMsg.set(null);

    const { email, password, confirmPassword } = this.form.value as {
      email: string;
      password: string;
      confirmPassword: string;
    };

    if (!email || !password || !confirmPassword) {
      this.form.markAllAsTouched();
      return;
    }

    if (password !== confirmPassword) {
      this.errorMsg.set('Пароли не совпадают');
      this.form.get('confirmPassword')?.setErrors({ mismatch: true });
      return;
    }

    try {
      this.loading.set(true);
      await this.auth.register(email, password);
      this.success.set(true);
      // Небольшая задержка для UX, затем переходим на главную
      setTimeout(() => this.router.navigateByUrl('/'), 500);
    } catch (e: unknown) {
      this.errorMsg.set(mapFirebaseError(e));
    } finally {
      this.loading.set(false);
    }
  }
}

function mapFirebaseError(e: unknown): string {
  const code = (e as { code?: string } | null | undefined)?.code;
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Этот e-mail уже зарегистрирован';
    case 'auth/invalid-email':
      return 'Некорректный e-mail';
    case 'auth/operation-not-allowed':
      return 'Регистрация отключена. Обратитесь к администратору';
    case 'auth/weak-password':
      return 'Слишком простой пароль (минимум 6 символов)';
    case 'auth/too-many-requests':
      return 'Слишком много попыток. Попробуйте позже';
    default:
      return 'Не удалось зарегистрироваться. Попробуйте ещё раз';
  }
}
