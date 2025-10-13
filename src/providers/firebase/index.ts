/**
 * Firebase Provider Implementation
 * Complete implementation of all provider interfaces for Firebase
 */

import {
  IProvider,
  IProviderConfig,
  IAuthProvider,
  IDatabaseProvider,
  IStorageProvider,
  IRealtimeProvider,
  IFunctionsProvider,
  IAnalyticsProvider,
  IMessagingProvider,
  IConfigProvider
} from '../interfaces';

import { FirebaseAuthProvider } from './auth.provider';
import { FirestoreProvider } from './database.provider';
import { FirebaseStorageProvider } from './storage.provider';
import { FirebaseRealtimeProvider } from './realtime.provider';
import { FirebaseFunctionsProvider } from './functions.provider';
import { FirebaseAnalyticsProvider } from './analytics.provider';
import { FirebaseMessagingProvider } from './messaging.provider';
import { FirebaseConfigProvider } from './config.provider';
import { FirebaseApp, initializeApp, getApps, getApp } from 'firebase/app';

export class FirebaseProvider implements IProvider {
  name = 'firebase';
  private app: FirebaseApp;

  auth: IAuthProvider;
  database: IDatabaseProvider;
  storage: IStorageProvider;
  realtime: IRealtimeProvider;
  functions: IFunctionsProvider;
  analytics: IAnalyticsProvider;
  messaging: IMessagingProvider;
  config: IConfigProvider;

  constructor(config?: IProviderConfig) {
    // Initialize Firebase app
    this.app = this.initializeFirebase(config);

    // Initialize all service providers
    this.auth = new FirebaseAuthProvider(this.app);
    this.database = new FirestoreProvider(this.app);
    this.storage = new FirebaseStorageProvider(this.app);
    this.realtime = new FirebaseRealtimeProvider(this.app);
    this.functions = new FirebaseFunctionsProvider(this.app);
    this.analytics = new FirebaseAnalyticsProvider(this.app);
    this.messaging = new FirebaseMessagingProvider(this.app);
    this.config = new FirebaseConfigProvider(this.app);
  }

  private initializeFirebase(config?: IProviderConfig): FirebaseApp {
    // Check if Firebase is already initialized
    const apps = getApps();
    if (apps.length > 0) {
      return getApp();
    }

    // Get Firebase configuration
    const firebaseConfig = config?.credentials || {
      projectId: process.env.FIREBASE_PROJECT_ID,
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      measurementId: process.env.FIREBASE_MEASUREMENT_ID
    };

    // Validate required fields
    if (!firebaseConfig.projectId) {
      throw new Error('Firebase project ID is required');
    }

    // Initialize Firebase app
    const app = initializeApp(firebaseConfig);

    // Connect to emulators if configured
    if (config?.options?.useEmulators || process.env.USE_FIREBASE_EMULATORS === 'true') {
      this.connectToEmulators(app);
    }

    return app;
  }

  private connectToEmulators(app: FirebaseApp): void {
    // Import necessary modules for emulators
    import('firebase/auth').then(({ connectAuthEmulator, getAuth }) => {
      const auth = getAuth(app);
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    });

    import('firebase/firestore').then(({ connectFirestoreEmulator, getFirestore }) => {
      const db = getFirestore(app);
      connectFirestoreEmulator(db, 'localhost', 8080);
    });

    import('firebase/storage').then(({ connectStorageEmulator, getStorage }) => {
      const storage = getStorage(app);
      connectStorageEmulator(storage, 'localhost', 9199);
    });

    import('firebase/functions').then(({ connectFunctionsEmulator, getFunctions }) => {
      const functions = getFunctions(app);
      connectFunctionsEmulator(functions, 'localhost', 5001);
    });

    import('firebase/database').then(({ connectDatabaseEmulator, getDatabase }) => {
      const database = getDatabase(app);
      connectDatabaseEmulator(database, 'localhost', 9000);
    });

    console.log('Connected to Firebase emulators');
  }

  /**
   * Get the Firebase app instance
   */
  getApp(): FirebaseApp {
    return this.app;
  }

  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    // Clean up any resources if needed
    // Firebase apps are typically persistent
  }
}

// Export individual providers for direct use
export { FirebaseAuthProvider } from './auth.provider';
export { FirestoreProvider } from './database.provider';
export { FirebaseStorageProvider } from './storage.provider';
export { FirebaseRealtimeProvider } from './realtime.provider';
export { FirebaseFunctionsProvider } from './functions.provider';
export { FirebaseAnalyticsProvider } from './analytics.provider';
export { FirebaseMessagingProvider } from './messaging.provider';
export { FirebaseConfigProvider } from './config.provider';