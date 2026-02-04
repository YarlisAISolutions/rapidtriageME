/**
 * On User Created Background Trigger
 * Triggered when a new user is created in Firebase Auth
 */

import { beforeUserCreated, HttpsError } from 'firebase-functions/v2/identity';
import * as admin from 'firebase-admin';
import { getFirestore, Collections } from '../config/firebase.config.js';

/**
 * User profile interface
 */
interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  lastLoginAt: string;
  plan: 'free' | 'user' | 'team' | 'enterprise';
  apiKeyCount: number;
  screenshotCount: number;
  settings: {
    notifications: boolean;
    darkMode: boolean;
    timezone: string;
    defaultProject?: string;
  };
  metadata: {
    provider: string;
    createdVia: string;
    ipAddress?: string;
  };
}

/**
 * Before User Created trigger
 * Runs before a new user is created in Firebase Auth
 */
export const onUserCreated = beforeUserCreated(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  async (event) => {
    const user = event.data;
    const db = getFirestore();

    console.log(`Processing new user: ${user.uid}`);

    try {
      // Check for blocked domains (optional)
      const blockedDomains = ['tempmail.com', 'throwaway.com'];
      const emailDomain = user.email?.split('@')[1];

      if (emailDomain && blockedDomains.includes(emailDomain)) {
        throw new HttpsError(
          'permission-denied',
          'Registration from this email domain is not allowed'
        );
      }

      // Determine provider
      const provider = user.providerData?.[0]?.providerId || 'password';

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        plan: 'free',
        apiKeyCount: 0,
        screenshotCount: 0,
        settings: {
          notifications: true,
          darkMode: false,
          timezone: 'UTC',
        },
        metadata: {
          provider,
          createdVia: 'firebase_auth',
          ipAddress: event.ipAddress,
        },
      };

      await db.collection(Collections.USERS).doc(user.uid).set(userProfile);
      console.log(`User profile created for: ${user.uid}`);

      // Create welcome notification (optional)
      await db.collection('notifications').add({
        userId: user.uid,
        type: 'welcome',
        title: 'Welcome to RapidTriageME!',
        message: 'Get started by installing the Chrome extension or generating an API key.',
        read: false,
        createdAt: new Date().toISOString(),
      });

      // Track new user metric
      const today = new Date().toISOString().split('T')[0];
      await db.collection(Collections.METRICS).doc(`users:${today}`).set({
        date: today,
        newUsers: admin.firestore.FieldValue.increment(1),
        lastUpdated: new Date().toISOString(),
      }, { merge: true });

      // Create audit log
      await db.collection(Collections.AUDIT_LOGS).add({
        type: 'user_created',
        userId: user.uid,
        email: user.email,
        provider,
        ipAddress: event.ipAddress,
        timestamp: new Date().toISOString(),
      });

      console.log(`New user processing completed: ${user.uid}`);

      // Return to allow user creation to proceed
      return;
    } catch (error) {
      console.error(`Error processing new user ${user.uid}:`, error);

      // If it's an HttpsError, re-throw to block user creation
      if (error instanceof HttpsError) {
        throw error;
      }

      // Log error but allow user creation to proceed
      await db.collection(Collections.AUDIT_LOGS).add({
        type: 'user_created_error',
        userId: user.uid,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }).catch(() => {
        // Ignore logging errors
      });

      return;
    }
  }
);
