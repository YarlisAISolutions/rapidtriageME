/**
 * Firebase Authentication Provider
 * Implements IAuthProvider interface for Firebase Auth
 */

import {
  IAuthProvider,
  IUser,
  IAuthResult,
  ITokenPayload,
  IApiKey,
  IApiKeyValidation,
  IMFASetup
} from '../interfaces';

import { FirebaseApp } from 'firebase/app';
import {
  Auth,
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail,
  updatePassword,
  sendEmailVerification,
  applyActionCode,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  signInWithPopup,
  linkWithPopup,
  unlink,
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  getIdToken,
  getIdTokenResult,
  updateProfile,
  deleteUser as firebaseDeleteUser
} from 'firebase/auth';

import {
  Firestore,
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';

import { getFunctions, httpsCallable } from 'firebase/functions';

export class FirebaseAuthProvider implements IAuthProvider {
  private auth: Auth;
  private db: Firestore;
  private functions: any;

  constructor(app: FirebaseApp) {
    this.auth = getAuth(app);
    this.db = getFirestore(app);
    this.functions = getFunctions(app);
  }

  /**
   * Register a new user
   */
  async register(email: string, password: string, metadata?: any): Promise<IUser> {
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      // Send verification email
      await sendEmailVerification(user);

      // Store additional user data in Firestore
      const userData = {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        metadata: {
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          ...metadata
        },
        role: 'user',
        subscription: {
          plan: 'free',
          status: 'active',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days trial
        }
      };

      await setDoc(doc(this.db, 'users', user.uid), userData);

      return this.mapFirebaseUser(user);
    } catch (error: any) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<IAuthResult> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      // Update last login time
      await updateDoc(doc(this.db, 'users', user.uid), {
        'metadata.lastLoginAt': serverTimestamp()
      });

      const token = await getIdToken(user);
      const refreshToken = user.refreshToken;

      return {
        user: await this.mapFirebaseUser(user),
        token,
        refreshToken,
        expiresIn: 3600 // 1 hour
      };
    } catch (error: any) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<IUser | null> {
    const user = this.auth.currentUser;
    if (!user) return null;
    return this.mapFirebaseUser(user);
  }

  /**
   * Update user information
   */
  async updateUser(userId: string, updates: Partial<IUser>): Promise<void> {
    const user = this.auth.currentUser;
    if (!user || user.uid !== userId) {
      throw new Error('User not authenticated or unauthorized');
    }

    // Update Firebase Auth profile
    if (updates.name || updates.photoUrl) {
      await updateProfile(user, {
        displayName: updates.name,
        photoURL: updates.photoUrl
      });
    }

    // Update Firestore document
    const userRef = doc(this.db, 'users', userId);
    await updateDoc(userRef, updates);
  }

  /**
   * Delete user account
   */
  async deleteUser(userId: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user || user.uid !== userId) {
      throw new Error('User not authenticated or unauthorized');
    }

    // Delete Firestore data
    await deleteDoc(doc(this.db, 'users', userId));

    // Delete auth account
    await firebaseDeleteUser(user);
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<ITokenPayload | null> {
    try {
      const verifyTokenFunction = httpsCallable(this.functions, 'verifyToken');
      const result = await verifyTokenFunction({ token });
      return result.data as ITokenPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken: string): Promise<IAuthResult> {
    // Firebase handles token refresh automatically
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }

    const token = await getIdToken(user, true);

    return {
      user: await this.mapFirebaseUser(user),
      token,
      refreshToken: user.refreshToken,
      expiresIn: 3600
    };
  }

  /**
   * Create custom token for user
   */
  async createCustomToken(userId: string, claims?: any): Promise<string> {
    const createTokenFunction = httpsCallable(this.functions, 'createCustomToken');
    const result = await createTokenFunction({ userId, claims });
    return result.data as string;
  }

  /**
   * Create API key for user
   */
  async createApiKey(userId: string, name: string, permissions: string[]): Promise<IApiKey> {
    const apiKeyId = this.generateApiKeyId();
    const apiKey = this.generateApiKey();

    const apiKeyData: IApiKey = {
      id: apiKeyId,
      name,
      key: apiKey,
      prefix: 'rtm',
      createdAt: new Date(),
      permissions,
      status: 'active'
    };

    // Store in Firestore
    await setDoc(doc(this.db, 'apiKeys', apiKeyId), {
      ...apiKeyData,
      userId,
      hashedKey: await this.hashApiKey(apiKey)
    });

    return apiKeyData;
  }

  /**
   * List user's API keys
   */
  async listApiKeys(userId: string): Promise<IApiKey[]> {
    const q = query(
      collection(this.db, 'apiKeys'),
      where('userId', '==', userId),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      // Don't return the actual key
      delete data.key;
      delete data.hashedKey;
      return data as IApiKey;
    });
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(keyId: string): Promise<void> {
    await updateDoc(doc(this.db, 'apiKeys', keyId), {
      status: 'revoked',
      revokedAt: serverTimestamp()
    });
  }

  /**
   * Validate API key
   */
  async validateApiKey(key: string): Promise<IApiKeyValidation | null> {
    const hashedKey = await this.hashApiKey(key);

    const q = query(
      collection(this.db, 'apiKeys'),
      where('hashedKey', '==', hashedKey),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const apiKeyData = snapshot.docs[0].data();

    // Check expiration
    if (apiKeyData.expiresAt && new Date(apiKeyData.expiresAt) < new Date()) {
      await updateDoc(doc(this.db, 'apiKeys', snapshot.docs[0].id), {
        status: 'expired'
      });
      return null;
    }

    // Update last used
    await updateDoc(doc(this.db, 'apiKeys', snapshot.docs[0].id), {
      lastUsedAt: serverTimestamp(),
      requestCount: (apiKeyData.requestCount || 0) + 1
    });

    return {
      valid: true,
      userId: apiKeyData.userId,
      permissions: apiKeyData.permissions,
      rateLimit: apiKeyData.rateLimit
    };
  }

  /**
   * Sign in with OAuth provider
   */
  async signInWithProvider(provider: 'google' | 'github' | 'microsoft' | 'keycloak'): Promise<IAuthResult> {
    let authProvider;

    switch (provider) {
      case 'google':
        authProvider = new GoogleAuthProvider();
        break;
      case 'github':
        authProvider = new GithubAuthProvider();
        break;
      case 'microsoft':
        authProvider = new OAuthProvider('microsoft.com');
        break;
      case 'keycloak':
        // Custom OAuth provider for Keycloak
        authProvider = new OAuthProvider('oidc.keycloak');
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    const result = await signInWithPopup(this.auth, authProvider);
    const user = result.user;
    const token = await getIdToken(user);

    // Store/update user in Firestore
    const userRef = doc(this.db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photoUrl: user.photoURL,
        emailVerified: user.emailVerified,
        metadata: {
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        },
        providers: user.providerData.map(p => p.providerId)
      });
    } else {
      await updateDoc(userRef, {
        'metadata.lastLoginAt': serverTimestamp(),
        providers: user.providerData.map(p => p.providerId)
      });
    }

    return {
      user: await this.mapFirebaseUser(user),
      token,
      refreshToken: user.refreshToken,
      expiresIn: 3600
    };
  }

  /**
   * Link OAuth provider to existing account
   */
  async linkProvider(userId: string, provider: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user || user.uid !== userId) {
      throw new Error('User not authenticated');
    }

    let authProvider;
    switch (provider) {
      case 'google':
        authProvider = new GoogleAuthProvider();
        break;
      case 'github':
        authProvider = new GithubAuthProvider();
        break;
      case 'microsoft':
        authProvider = new OAuthProvider('microsoft.com');
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    await linkWithPopup(user, authProvider);
  }

  /**
   * Unlink OAuth provider from account
   */
  async unlinkProvider(userId: string, provider: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user || user.uid !== userId) {
      throw new Error('User not authenticated');
    }

    await unlink(user, provider);
  }

  /**
   * Enable multi-factor authentication
   */
  async enableMFA(userId: string, method: 'totp' | 'sms' | 'email'): Promise<IMFASetup> {
    const user = this.auth.currentUser;
    if (!user || user.uid !== userId) {
      throw new Error('User not authenticated');
    }

    if (method === 'sms') {
      // Phone MFA setup
      const multiFactorSession = await multiFactor(user).getSession();
      const phoneAuthProvider = new PhoneAuthProvider(this.auth);

      // This would need actual phone number from user
      // const verificationId = await phoneAuthProvider.verifyPhoneNumber(phoneNumber, multiFactorSession);

      return {
        // Return setup info
        backupCodes: await this.generateBackupCodes(userId)
      };
    }

    // For TOTP, we'd need to implement server-side generation
    const setupMFAFunction = httpsCallable(this.functions, 'setupMFA');
    const result = await setupMFAFunction({ userId, method });

    return result.data as IMFASetup;
  }

  /**
   * Verify MFA code
   */
  async verifyMFA(userId: string, code: string): Promise<boolean> {
    const verifyMFAFunction = httpsCallable(this.functions, 'verifyMFA');
    const result = await verifyMFAFunction({ userId, code });
    return result.data as boolean;
  }

  /**
   * Disable MFA
   */
  async disableMFA(userId: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user || user.uid !== userId) {
      throw new Error('User not authenticated');
    }

    // Unenroll from MFA
    const mfaUser = multiFactor(user);
    const enrolledFactors = mfaUser.enrolledFactors;

    for (const factor of enrolledFactors) {
      await mfaUser.unenroll(factor);
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user || user.uid !== userId) {
      throw new Error('User not authenticated');
    }

    // Re-authenticate user first
    const credential = await signInWithEmailAndPassword(this.auth, user.email!, oldPassword);

    // Update password
    await updatePassword(user, newPassword);
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(userId: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user || user.uid !== userId) {
      throw new Error('User not authenticated');
    }

    await sendEmailVerification(user);
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    await applyActionCode(this.auth, token);
  }

  // Helper methods

  private async mapFirebaseUser(firebaseUser: FirebaseUser): Promise<IUser> {
    const idTokenResult = await getIdTokenResult(firebaseUser);

    // Get additional user data from Firestore
    const userDoc = await getDoc(doc(this.db, 'users', firebaseUser.uid));
    const userData = userDoc.data();

    return {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      name: firebaseUser.displayName || userData?.name,
      photoUrl: firebaseUser.photoURL || userData?.photoUrl,
      emailVerified: firebaseUser.emailVerified,
      phoneNumber: firebaseUser.phoneNumber || userData?.phoneNumber,
      metadata: {
        createdAt: new Date(firebaseUser.metadata.creationTime!),
        lastLoginAt: new Date(firebaseUser.metadata.lastSignInTime!)
      },
      customClaims: idTokenResult.claims,
      providers: firebaseUser.providerData.map(p => p.providerId)
    };
  }

  private generateApiKeyId(): string {
    return 'key_' + Math.random().toString(36).substring(2, 15);
  }

  private generateApiKey(): string {
    return 'rtm_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private async hashApiKey(key: string): Promise<string> {
    // Simple hash for demonstration - use proper hashing in production
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async generateBackupCodes(userId: string): Promise<string[]> {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }

    // Store hashed backup codes in Firestore
    await setDoc(doc(this.db, 'users', userId, 'security', 'backupCodes'), {
      codes: await Promise.all(codes.map(c => this.hashApiKey(c))),
      createdAt: serverTimestamp()
    });

    return codes;
  }
}