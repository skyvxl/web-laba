import { inject, Injectable, PLATFORM_ID, TransferState } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { account, ID } from '../config/appwrite';
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
    try {
      const user = await account.get();
      this.userSubject.next(user);
    } catch {
      // Пользователь не авторизован
      this.userSubject.next(null);
    } finally {
      this.initializedSubject.next(true);
    }
  }

  async login(email: string, password: string): Promise<Models.Session> {
    const session = await account.createEmailPasswordSession(email, password);
    await this.checkAuthState();
    return session;
  }

  async register(email: string, password: string): Promise<Models.User<Models.Preferences>> {
    const user = await account.create(ID.unique(), email, password);
    await this.login(email, password);
    return user;
  }

  async logout(): Promise<void> {
    await account.deleteSession('current');
    this.userSubject.next(null);
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
