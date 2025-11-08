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
  registerName = signal('');
  registerPhone = signal('');
  agreeConsent = signal(false);
  agreePrivacy = signal(false);

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

  onRegisterNameChange(value: string) {
    this.registerName.set(value);
  }

  onRegisterPhoneChange(value: string) {
    this.registerPhone.set(value);
  }

  onAgreeConsentChange(value: boolean) {
    this.agreeConsent.set(!!value);
  }

  onAgreePrivacyChange(value: boolean) {
    this.agreePrivacy.set(!!value);
  }

  register() {
    this.registerErrorMsg.set('');

    if (this.registerPassword() !== this.registerConfirmPassword()) {
      this.registerErrorMsg.set('Пароли не совпадают');
      return;
    }

    // Email required + basic format
    const email = this.registerEmail().trim();
    if (!email) {
      this.registerErrorMsg.set('Введите email');
      return;
    }
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(email)) {
      this.registerErrorMsg.set('Некорректный email');
      return;
    }

    // Пароль минимальная длина
    if (this.registerPassword().length < 8) {
      this.registerErrorMsg.set('Пароль должен содержать минимум 8 символов');
      return;
    }

    if (!this.registerName().trim()) {
      this.registerErrorMsg.set('Введите ваше имя');
      return;
    }

    // Нормализуем номер: убираем пробелы/скобки/тире, оставляем только цифры и восстанавливаем +
    const phoneInput = this.registerPhone().trim();
    let digits = phoneInput.replace(/\D/g, '');
    // Если пользователь ввёл 11 цифр, начинающихся с 8, заменим ведущую 8 на 7
    if (digits.length === 11 && digits.startsWith('8')) {
      digits = '7' + digits.slice(1);
    }
    const normalizedPhone = digits ? '+' + digits : '';
    const phoneRegex = /^\+7\d{10}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      this.registerErrorMsg.set('Номер должен быть в формате +7XXXXXXXXXX');
      return;
    }

    if (!this.agreeConsent() || !this.agreePrivacy()) {
      this.registerErrorMsg.set('Необходимо согласиться с СОД и политикой конфиденциальности');
      return;
    }

    this.registerLoading.set(true);

    this.authService
      .register(email, this.registerPassword(), this.registerName(), normalizedPhone)
      .then(() => {
        this.router.navigate(['/']);
      })
      .catch((error) => {
        const msg = (error?.message || '') as string;
        const server = JSON.stringify(error || {});

        // Подробные проверки на распространённые политики паролей Appwrite
        if (
          msg.includes('user_already_exists') ||
          msg.includes('already exists') ||
          server.includes('user_already_exists')
        ) {
          this.registerErrorMsg.set('Этот email уже используется');
        } else if (
          msg.toLowerCase().includes('history') ||
          server.toLowerCase().includes('password_history')
        ) {
          this.registerErrorMsg.set('Нельзя использовать один из ваших недавних паролей');
        } else if (
          msg.toLowerCase().includes('dictionary') ||
          msg.toLowerCase().includes('common') ||
          server.toLowerCase().includes('password_dictionary')
        ) {
          this.registerErrorMsg.set('Пароль слишком простой или часто используемый');
        } else if (
          msg.toLowerCase().includes('personal') ||
          msg.toLowerCase().includes('contains') ||
          server.toLowerCase().includes('personal')
        ) {
          this.registerErrorMsg.set('Пароль не должен содержать ваше имя, email или телефон');
        } else if (
          msg.toLowerCase().includes('short') ||
          msg.toLowerCase().includes('weak') ||
          msg.toLowerCase().includes('length')
        ) {
          this.registerErrorMsg.set('Пароль должен содержать минимум 8 символов');
        } else {
          // fallback — если Appwrite отдаст структуру error.message или error.response
          this.registerErrorMsg.set(msg || 'Ошибка регистрации');
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
