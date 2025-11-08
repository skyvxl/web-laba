import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { BaseInput } from '../../shared/components/base-input/base-input';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [BaseInput],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class Auth {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Login form
  loginEmail = signal('');
  loginPassword = signal('');
  loginErrorMsg = signal('');
  loginLoading = signal(false);

  // Register form
  registerEmail = signal('');
  registerPassword = signal('');
  registerConfirmPassword = signal('');
  registerErrorMsg = signal('');
  registerLoading = signal(false);

  activeTab = signal<'login' | 'register'>('login');

  // Login handlers
  onLoginEmailChange(value: string) {
    this.loginEmail.set(value);
  }

  onLoginPasswordChange(value: string) {
    this.loginPassword.set(value);
  }

  login() {
    this.loginErrorMsg.set('');
    this.loginLoading.set(true);

    this.authService
      .login(this.loginEmail(), this.loginPassword())
      .then(() => {
        this.router.navigate(['/']);
      })
      .catch(() => {
        this.loginErrorMsg.set('Неверный email или пароль');
      })
      .finally(() => {
        this.loginLoading.set(false);
      });
  }

  // Register handlers
  onRegisterEmailChange(value: string) {
    this.registerEmail.set(value);
  }

  onRegisterPasswordChange(value: string) {
    this.registerPassword.set(value);
  }

  onRegisterConfirmPasswordChange(value: string) {
    this.registerConfirmPassword.set(value);
  }

  register() {
    this.registerErrorMsg.set('');

    if (this.registerPassword() !== this.registerConfirmPassword()) {
      this.registerErrorMsg.set('Пароли не совпадают');
      return;
    }

    this.registerLoading.set(true);

    this.authService
      .register(this.registerEmail(), this.registerPassword())
      .then(() => {
        this.router.navigate(['/']);
      })
      .catch((error) => {
        if (error.code === 'auth/email-already-in-use') {
          this.registerErrorMsg.set('Этот email уже используется');
        } else if (error.code === 'auth/weak-password') {
          this.registerErrorMsg.set('Пароль должен содержать минимум 6 символов');
        } else {
          this.registerErrorMsg.set('Ошибка регистрации');
        }
      })
      .finally(() => {
        this.registerLoading.set(false);
      });
  }

  setActiveTab(tab: 'login' | 'register') {
    this.activeTab.set(tab);
    this.loginErrorMsg.set('');
    this.registerErrorMsg.set('');
  }
}
