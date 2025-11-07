import { inject, Injectable, PLATFORM_ID, TransferState, makeStateKey } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  UserCredential,
  authState,
  User,
} from '@angular/fire/auth';
import { Observable, of } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

const AUTH_STATE_KEY = makeStateKey<User | null>('authState');

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private readonly transferState = inject(TransferState);
  private readonly platformId = inject(PLATFORM_ID);

  login(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  register(email: string, password: string): Promise<UserCredential> {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  logout(): Promise<void> {
    return signOut(this.auth);
  }

  getAuthState(): Observable<User | null> {
    const cachedAuthState = this.transferState.get(AUTH_STATE_KEY, undefined);

    if (cachedAuthState !== undefined) {
      if (isPlatformBrowser(this.platformId)) {
        this.transferState.remove(AUTH_STATE_KEY);
      }
      return of(cachedAuthState).pipe(switchMap(() => authState(this.auth)));
    }

    return authState(this.auth).pipe(
      tap((user) => {
        if (!isPlatformBrowser(this.platformId)) {
          this.transferState.set(AUTH_STATE_KEY, user);
        }
      }),
    );
  }
}
