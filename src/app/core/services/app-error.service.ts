import { Injectable } from '@angular/core';

export type AppErrorCode =
  | 'phone_already_exists'
  | 'email_already_exists'
  | 'invalid_password'
  | 'password_history'
  | 'password_dictionary'
  | 'password_personal'
  | 'password_too_short'
  | 'rate_limit'
  | 'resource_already_exists'
  | 'file_size_exceeded'
  | 'file_type_not_allowed'
  | 'unknown_error';

export interface AppErrorInfo {
  code: AppErrorCode;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AppErrorService {
  /**
   * Map an unknown error (Appwrite error or JS error) to a standardized AppErrorInfo
   */
  parse(err: unknown): AppErrorInfo {
    const raw = (err as Error)?.message ?? String(err ?? '');
    const lower = raw.toLowerCase();
    const json = (() => {
      try {
        return JSON.stringify(err ?? {});
      } catch {
        return '';
      }
    })();

    // Phone already exists - check FIRST before generic user checks
    // Specific Appwrite message: "A user with the same phone number already exists in the current project."
    if (
      (lower.includes('phone number') && lower.includes('already exists')) ||
      (lower.includes('phone') && lower.includes('already') && !lower.includes('email'))
    ) {
      return { code: 'phone_already_exists', message: 'Этот номер уже зарегистрирован' };
    }

    // Specific Appwrite message: "A user with the same id, email, or phone already exists in this project."
    // This is ambiguous - could be email OR phone, so we check context
    if (
      lower.includes('a user with the same id') &&
      lower.includes('email') &&
      lower.includes('phone')
    ) {
      // If message mentions both email and phone, it's ambiguous - default to email
      return {
        code: 'email_already_exists',
        message: 'Этот email уже используется',
      };
    }

    // Generic "target with the same id already exists" (some SDKs return this phrase on conflict)
    if (
      lower.includes('a target with the same id already exists') ||
      lower.includes('target with the same id')
    ) {
      return {
        code: 'email_already_exists',
        message: 'Этот email уже используется',
      };
    }

    if (
      json.toLowerCase().includes('phone_already_exists') ||
      lower.includes('phone_already_exists')
    ) {
      return { code: 'phone_already_exists', message: 'Этот номер уже зарегистрирован' };
    }

    // Email / user already exists (specific)
    if (
      (lower.includes('user') && lower.includes('already')) ||
      (lower.includes('email') && lower.includes('already')) ||
      json.toLowerCase().includes('user_already_exists') ||
      json.toLowerCase().includes('email_already_exists') ||
      lower.includes('user_already_exists') ||
      lower.includes('email_already_exists')
    ) {
      return { code: 'email_already_exists', message: 'Этот email уже используется' };
    }

    // Invalid / incorrect password — try to match common phrases
    if (
      (lower.includes('invalid') && lower.includes('password')) ||
      (lower.includes('incorrect') && lower.includes('password')) ||
      lower.includes('please check the email and password') ||
      lower.includes('please check the email and')
    ) {
      return { code: 'invalid_password', message: 'Неверный email или пароль' };
    }

    // Password similarity to previous (Appwrite message)
    if (
      lower.includes('similar to your previous') ||
      (lower.includes('similar') && lower.includes('previous password'))
    ) {
      return {
        code: 'password_history',
        message: 'Пароль похож на предыдущий. В целях безопасности выберите другой пароль',
      };
    }

    // Password policy errors
    if (lower.includes('password_history') || lower.includes('history')) {
      return {
        code: 'password_history',
        message: 'Нельзя использовать один из ваших недавних паролей',
      };
    }

    // Specific Appwrite message: "A user with the same id, email, or phone already exists in this project."
    if (
      lower.includes('a user with the same id') &&
      lower.includes('email') &&
      lower.includes('phone')
    ) {
      return {
        code: 'resource_already_exists',
        message: 'Пользователь с таким же ID, email или телефоном уже существует в этом проекте.',
      };
    }
    if (
      lower.includes('password_dictionary') ||
      lower.includes('dictionary') ||
      lower.includes('common')
    ) {
      return {
        code: 'password_dictionary',
        message: 'Пароль слишком простой или часто используемый',
      };
    }
    if (lower.includes('personal') || lower.includes('contains')) {
      return {
        code: 'password_personal',
        message: 'Пароль не должен содержать ваше имя, email или телефон',
      };
    }
    if (lower.includes('short') || lower.includes('weak') || lower.includes('length')) {
      return { code: 'password_too_short', message: 'Пароль должен содержать минимум 8 символов' };
    }

    // Generic "resource already exists"

    // File validation errors (from front-end preflight checks)
    if (lower.includes('file_size_exceeded') || json.toLowerCase().includes('file_size_exceeded')) {
      return { code: 'file_size_exceeded', message: 'Файл слишком большой (максимум 5 МБ)' };
    }
    if (
      lower.includes('file_type_not_allowed') ||
      json.toLowerCase().includes('file_type_not_allowed')
    ) {
      return { code: 'file_type_not_allowed', message: 'Неподдерживаемый формат файла' };
    }
    if (lower.includes('already exists') || lower.includes('already_exists')) {
      return { code: 'resource_already_exists', message: 'Запись уже существует' };
    }

    // fallback
    return { code: 'unknown_error', message: raw || 'Неизвестная ошибка' };
  }
}
