import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getDatabase, provideDatabase } from '@angular/fire/database';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'test-angular-deploy-1b983',
        appId: '1:52651766909:web:b6bfb7f3f19417e3a06d14',
        storageBucket: 'test-angular-deploy-1b983.firebasestorage.app',
        apiKey: 'AIzaSyAhM8cqT0Wa7TwMZCJXxieMF6dZ6WNtMtk',
        authDomain: 'test-angular-deploy-1b983.firebaseapp.com',
        messagingSenderId: '52651766909',
        measurementId: 'G-KJYTJQVWWE',
      }),
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideDatabase(() => getDatabase()),
    provideMessaging(() => getMessaging()),
    provideClientHydration(withEventReplay()),
  ],
};
