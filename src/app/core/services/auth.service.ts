import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { account, ID } from '../config/appwrite';
import type { Models } from 'appwrite';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private userSubject = new BehaviorSubject<Models.User<Models.Preferences> | null>(null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkAuthState();
    }
  }

  private async checkAuthState() {
    try {
      const user = await account.get();
      this.userSubject.next(user);
    } catch (error) {
      // Игнорируем ошибку 401 (пользователь не авторизован) - это нормально
      this.userSubject.next(null);
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
}
