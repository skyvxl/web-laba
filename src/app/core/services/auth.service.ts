import { inject, Injectable, PLATFORM_ID, TransferState } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { account, ID, storage } from '../config/appwrite';
import { environment } from '../../../environments/environment';
import type { Models } from 'appwrite';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly transferState = inject(TransferState);
  private userSubject = new BehaviorSubject<Models.User<Models.Preferences> | null>(null);
  private initializedSubject = new BehaviorSubject<boolean>(false);
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initializeAuth();
  }

  /**
   * Upload user avatar to storage and register it in user prefs.
   * Returns the created file metadata object.
   */
  async uploadAvatar(file: File): Promise<Models.File> {
    try {
      // Validate size
      const maxBytes = 5 * 1024 * 1024; // 5 MB
      if (file.size > maxBytes) throw new Error('file_size_exceeded');
      // Validate extension
      const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!allowed.includes(ext)) throw new Error('file_type_not_allowed');

      const bucketId = environment.appwriteAvatarBucketId;

      // Get current user to set file permissions
      const currentUser = await account.get();

      // Upload file with explicit permissions
      const res = await storage.createFile(bucketId, ID.unique(), file, [
        `read("user:${currentUser.$id}")`, // Owner can read
        `read("users")`, // Any authenticated user can read (for public avatars)
        `update("user:${currentUser.$id}")`, // Only owner can update
        `delete("user:${currentUser.$id}")`, // Only owner can delete
      ]);

      // Store reference in user prefs
      await this.setPreferences({ avatarFileId: res.$id, avatarFileName: res.name });
      return res;
    } catch (err) {
      console.warn('Failed to upload avatar', err);
      throw err;
    }
  }

  /**
   * Delete avatar file from storage and clear prefs
   */
  async deleteAvatar(fileId: string): Promise<void> {
    try {
      const bucketId = environment.appwriteAvatarBucketId;
      await storage.deleteFile(bucketId, fileId);
    } catch {
      // ignore
    }
    try {
      // remove prefs
      await this.setPreferences({ avatarFileId: null });
    } catch {
      // ignore
    }
  }

  /** Build a public view URL for a given fileId in avatar bucket */
  getAvatarUrl(fileId: string): string {
    if (!fileId) return '';
    const bucketId = environment.appwriteAvatarBucketId;
    // Use SDK method to get proper URL with project parameter
    return storage.getFileView(bucketId, fileId).toString();
  }

  private async initializeAuth(): Promise<void> {
    // На сервере не делаем запрос к Appwrite - cookies недоступны
    if (isPlatformServer(this.platformId)) {
      this.userSubject.next(null);
      this.initializedSubject.next(true);
      return;
    }

    // На клиенте всегда проверяем реальное состояние сессии
    if (isPlatformBrowser(this.platformId)) {
      await this.checkAuthState();
    }
  }

  private async checkAuthState() {
    // Retry logic for handling 502 errors during initial auth check
    const maxRetries = 2;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const user = await account.get();
        this.userSubject.next(user);
        this.initializedSubject.next(true);
        return;
      } catch (err: unknown) {
        // Check if it's a network/server error
        const isRetryableError =
          err instanceof Error &&
          (err.message.includes('502') ||
            err.message.includes('503') ||
            err.message.includes('CORS') ||
            err.message.includes('Network') ||
            err.message.includes('Failed to fetch'));

        // If it's the last attempt or not a retryable error, break
        if (attempt === maxRetries || !isRetryableError) {
          break;
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
        console.warn(`Auth check attempt ${attempt} failed, retrying...`);
      }
    }

    // Пользователь не авторизован или не удалось получить данные
    this.userSubject.next(null);
    this.initializedSubject.next(true);
  }

  async login(email: string, password: string): Promise<Models.Session> {
    // Retry logic for handling 502 errors (cold start/server issues)
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const session = await account.createEmailPasswordSession(email, password);
        await this.checkAuthState();
        return session;
      } catch (err: unknown) {
        // Check if it's a network/server error (502, 503, CORS, timeout)
        const isRetryableError =
          err instanceof Error &&
          (err.message.includes('502') ||
            err.message.includes('503') ||
            err.message.includes('CORS') ||
            err.message.includes('Network') ||
            err.message.includes('Failed to fetch'));

        // If it's the last attempt or not a retryable error, throw
        if (attempt === maxRetries || !isRetryableError) {
          throw err;
        }

        // Wait before retrying (exponential backoff: 500ms, 1000ms, 2000ms)
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        console.warn(`Login attempt ${attempt} failed, retrying...`);
      }
    }

    // This point should never be reached due to throw in loop, but TypeScript requires it
    throw new Error('Login failed after retries');
  }

  async register(
    email: string,
    password: string,
    name?: string,
    phone?: string,
  ): Promise<Models.User<Models.Preferences>> {
    const user = await account.create(ID.unique(), email, password, name || undefined);

    // Создаём сессию
    await this.login(email, password);

    try {
      if (phone) {
        // optional extended methods on Appwrite Account (some SDK versions include these)
        const accountExt = account as unknown as {
          updatePhone?: (args: {
            phone: string;
            password?: string;
          }) => Promise<Models.User<Models.Preferences> | void>;
          delete?: () => Promise<void>;
        };
        if (typeof accountExt.updatePhone === 'function') {
          try {
            await accountExt.updatePhone({ phone, password });
            await this.checkAuthState();
          } catch (err: unknown) {
            // If phone already exists, cleanup and rethrow notable error
            const msg = ((err as Error)?.message ?? String(err)).toLowerCase();
            if (msg.includes('phone') || msg.includes('already')) {
              try {
                // delete the created user and logout - use account.delete() to remove current user if available
                if (typeof accountExt.delete === 'function') await accountExt.delete();
              } catch {
                // ignore
              }
              throw new Error('phone_already_exists');
            }
            throw err;
          }
        }
      }
    } catch (err: unknown) {
      console.warn('Failed to update phone on register', err);
      throw err;
    }

    return user;
  }

  async logout(): Promise<void> {
    await account.deleteSession('current');
    this.userSubject.next(null);
  }

  /**
   * Получить пользовательские настройки (prefs) из Appwrite (если доступны)
   */
  async getPreferences(): Promise<Record<string, unknown>> {
    try {
      const accountExt = account as unknown as {
        getPrefs?: () => Promise<Record<string, unknown>>;
      };
      if (typeof accountExt.getPrefs === 'function') {
        const prefs = await accountExt.getPrefs();
        return prefs ?? {};
      }
    } catch {
      // ignore
    }
    return {};
  }

  /**
   * Установить одну или несколько пользовательских настроек в Appwrite prefs
   */
  async setPreferences(prefs: Record<string, unknown>): Promise<void> {
    try {
      const accountExt = account as unknown as {
        updatePrefs?: (prefs: Record<string, unknown>) => Promise<void>;
      };
      if (typeof accountExt.updatePrefs === 'function') {
        await accountExt.updatePrefs(prefs);
        // refresh local user state
        await this.checkAuthState();
      }
    } catch (err) {
      console.warn('Failed to update prefs', err);
    }
  }

  /**
   * Update user email (if supported by SDK)
   */
  async updateEmail(newEmail: string, password?: string): Promise<void> {
    try {
      const accountExt = account as unknown as {
        updateEmail?: (email: string, password?: string) => Promise<void>;
      };
      if (typeof accountExt.updateEmail === 'function') {
        await accountExt.updateEmail(newEmail, password);
        await this.checkAuthState();
        return;
      }
      // Not supported - throw
      throw new Error('update_email_unsupported');
    } catch (err) {
      console.warn('Failed to update email', err);
      throw err;
    }
  }

  async updatePassword(newPassword: string, oldPassword?: string): Promise<void> {
    try {
      const accountExt = account as unknown as {
        updatePassword?: (newPassword: string, oldPassword?: string) => Promise<void>;
      };
      if (typeof accountExt.updatePassword === 'function') {
        await accountExt.updatePassword(newPassword, oldPassword);
        await this.checkAuthState();
        return;
      }
      throw new Error('update_password_unsupported');
    } catch (err) {
      console.warn('Failed to update password', err);
      throw err;
    }
  }

  getAuthState(): Observable<Models.User<Models.Preferences> | null> {
    return this.userSubject.asObservable();
  }

  getInitialized(): Observable<boolean> {
    return this.initializedSubject.asObservable();
  }

  async waitForInitialization(): Promise<Models.User<Models.Preferences> | null> {
    // Ждем завершения первичной инициализации
    if (this.initPromise) {
      await this.initPromise;
    }

    if (this.initializedSubject.value) {
      return this.userSubject.value;
    }

    return new Promise((resolve) => {
      const sub = this.initializedSubject.subscribe((initialized) => {
        if (initialized) {
          sub.unsubscribe();
          resolve(this.userSubject.value);
        }
      });
    });
  }
}
