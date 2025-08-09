import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { 
  FIREBASE_API_KEY, 
  FIREBASE_AUTH_DOMAIN, 
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID 
} from '@env';
import { ApiService } from '../api/api.service';

/**
 * Authentication provider types supported by the app
 * Covers major social login options and traditional email/password
 */
export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
  APPLE = 'apple',
  GITHUB = 'github'
}

/**
 * User profile information structure
 * Contains all essential user data for the application
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  emailVerified: boolean;
  provider: AuthProvider;
  createdAt: Date;
  lastLoginAt: Date;
  customClaims?: Record<string, any>;
}

/**
 * Authentication tokens structure
 * Manages access and refresh tokens for secure API communication
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  tokenType: 'Bearer';
}

/**
 * Authentication state interface
 * Tracks current user state and authentication status
 */
export interface AuthState {
  user: UserProfile | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  lastError: string | null;
}

/**
 * Social login configuration interface
 * Contains provider-specific configuration for OAuth flows
 */
export interface SocialLoginConfig {
  provider: AuthProvider;
  clientId?: string;
  redirectUri?: string;
  scopes?: string[];
  additionalParams?: Record<string, string>;
}

/**
 * Password reset request interface
 * Handles password reset email functionality
 */
export interface PasswordResetRequest {
  email: string;
  actionCodeSettings?: {
    url: string;
    handleCodeInApp: boolean;
    iOS?: {
      bundleId: string;
    };
    android?: {
      packageName: string;
      installApp?: boolean;
      minimumVersion?: string;
    };
  };
}

/**
 * Email verification configuration
 * Manages email verification flow settings
 */
export interface EmailVerificationConfig {
  actionCodeSettings?: {
    url: string;
    handleCodeInApp: boolean;
  };
}

/**
 * Comprehensive authentication service for Firebase and social providers
 * Handles all authentication operations including login, registration, and token management
 * 
 * Key features:
 * - Firebase Authentication integration with custom token handling
 * - Social login support (Google, Apple, GitHub)
 * - Secure token storage using Expo SecureStore
 * - Email verification and password reset flows
 * - User profile management and customization
 * - Authentication state management with observers
 * - Offline authentication support with cached tokens
 */
class AuthService {
  private apiService: ApiService;
  private authStateListeners: Array<(state: AuthState) => void> = [];
  private currentAuthState: AuthState = {
    user: null,
    tokens: null,
    isLoading: false,
    isAuthenticated: false,
    lastError: null
  };

  // Secure storage keys for token management
  private readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'auth_access_token',
    REFRESH_TOKEN: 'auth_refresh_token',
    TOKEN_EXPIRES_AT: 'auth_token_expires_at',
    USER_PROFILE: 'auth_user_profile'
  };

  constructor(apiService: ApiService) {
    this.apiService = apiService;
    this.initializeAuthStateListener();
  }

  /**
   * Initialize Firebase auth state listener
   * Monitors authentication state changes and updates app state accordingly
   */
  private initializeAuthStateListener(): void {
    auth().onAuthStateChanged(async (firebaseUser) => {
      try {
        this.updateAuthState({ isLoading: true });

        if (firebaseUser) {
          // User is signed in, get user profile and tokens
          const userProfile = await this.createUserProfileFromFirebase(firebaseUser);
          const tokens = await this.getTokensFromFirebase(firebaseUser);
          
          // Store tokens securely for offline access
          await this.storeTokensSecurely(tokens);
          
          this.updateAuthState({
            user: userProfile,
            tokens,
            isAuthenticated: true,
            isLoading: false,
            lastError: null
          });
        } else {
          // User is signed out, clear stored data
          await this.clearStoredTokens();
          
          this.updateAuthState({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
            lastError: null
          });
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        this.updateAuthState({
          isLoading: false,
          lastError: error.message
        });
      }
    });
  }

  /**
   * Register new user with email and password
   * Includes automatic email verification and profile creation
   * 
   * @param email - User email address
   * @param password - User password (must meet security requirements)
   * @param displayName - Optional display name for the user
   */
  async registerWithEmail(
    email: string, 
    password: string, 
    displayName?: string
  ): Promise<UserProfile> {
    try {
      this.updateAuthState({ isLoading: true, lastError: null });

      // Validate input parameters
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Create user with Firebase Authentication
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;

      // Update user profile with display name if provided
      if (displayName) {
        await firebaseUser.updateProfile({ displayName });
      }

      // Send email verification
      await this.sendEmailVerification();

      // Create user profile object
      const userProfile = await this.createUserProfileFromFirebase(firebaseUser);

      // Sync user profile with backend API
      await this.syncUserProfileWithBackend(userProfile);

      return userProfile;
    } catch (error) {
      console.error('Registration error:', error);
      this.updateAuthState({ 
        isLoading: false, 
        lastError: this.getAuthErrorMessage(error.code) 
      });
      throw error;
    }
  }

  /**
   * Sign in user with email and password
   * Handles authentication and token management
   * 
   * @param email - User email address
   * @param password - User password
   */
  async signInWithEmail(email: string, password: string): Promise<UserProfile> {
    try {
      this.updateAuthState({ isLoading: true, lastError: null });

      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Authenticate with Firebase
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const userProfile = await this.createUserProfileFromFirebase(userCredential.user);

      // Update last login timestamp in backend
      await this.updateLastLogin(userProfile.uid);

      return userProfile;
    } catch (error) {
      console.error('Sign in error:', error);
      this.updateAuthState({ 
        isLoading: false, 
        lastError: this.getAuthErrorMessage(error.code) 
      });
      throw error;
    }
  }

  /**
   * Sign in with Google OAuth
   * Handles Google Sign-In flow with Firebase integration
   */
  async signInWithGoogle(): Promise<UserProfile> {
    try {
      this.updateAuthState({ isLoading: true, lastError: null });

      // Configure Google Sign-In
      const request = new AuthSession.AuthRequest({
        clientId: process.env.GOOGLE_CLIENT_ID,
        scopes: ['openid', 'profile', 'email'],
        redirectUri: AuthSession.makeRedirectUri({
          scheme: 'com.rapidtriage.mobile',
          path: 'auth/google/callback'
        }),
        responseType: AuthSession.ResponseType.Code,
        state: 'google_signin',
      });

      // Perform OAuth flow
      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      });

      if (result.type !== 'success') {
        throw new Error('Google sign-in was cancelled or failed');
      }

      // Exchange authorization code for tokens
      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: process.env.GOOGLE_CLIENT_ID,
          code: result.params.code,
          redirectUri: request.redirectUri,
          extraParams: {},
        },
        {
          tokenEndpoint: 'https://oauth2.googleapis.com/token',
        }
      );

      // Create Google credential for Firebase
      const credential = auth.GoogleAuthProvider.credential(
        tokenResponse.idToken,
        tokenResponse.accessToken
      );

      // Sign in to Firebase with Google credential
      const userCredential = await auth().signInWithCredential(credential);
      const userProfile = await this.createUserProfileFromFirebase(userCredential.user);

      // Sync with backend
      await this.syncUserProfileWithBackend(userProfile);

      return userProfile;
    } catch (error) {
      console.error('Google sign-in error:', error);
      this.updateAuthState({ 
        isLoading: false, 
        lastError: 'Google sign-in failed. Please try again.' 
      });
      throw error;
    }
  }

  /**
   * Sign in with Apple OAuth
   * Handles Apple Sign-In flow with Firebase integration
   */
  async signInWithApple(): Promise<UserProfile> {
    try {
      this.updateAuthState({ isLoading: true, lastError: null });

      // Note: Apple Sign-In requires additional native configuration
      // This is a placeholder implementation that would need platform-specific setup
      
      const request = new AuthSession.AuthRequest({
        clientId: process.env.APPLE_CLIENT_ID,
        scopes: ['name', 'email'],
        redirectUri: AuthSession.makeRedirectUri({
          scheme: 'com.rapidtriage.mobile',
          path: 'auth/apple/callback'
        }),
        responseType: AuthSession.ResponseType.Code,
        state: 'apple_signin',
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
      });

      if (result.type !== 'success') {
        throw new Error('Apple sign-in was cancelled or failed');
      }

      // Process Apple sign-in result
      // In a production app, you would handle the Apple identity token here
      throw new Error('Apple Sign-In implementation requires platform-specific configuration');
    } catch (error) {
      console.error('Apple sign-in error:', error);
      this.updateAuthState({ 
        isLoading: false, 
        lastError: 'Apple sign-in is not yet available.' 
      });
      throw error;
    }
  }

  /**
   * Sign in with GitHub OAuth
   * Handles GitHub authentication flow
   */
  async signInWithGitHub(): Promise<UserProfile> {
    try {
      this.updateAuthState({ isLoading: true, lastError: null });

      const request = new AuthSession.AuthRequest({
        clientId: process.env.GITHUB_CLIENT_ID,
        scopes: ['user:email'],
        redirectUri: AuthSession.makeRedirectUri({
          scheme: 'com.rapidtriage.mobile',
          path: 'auth/github/callback'
        }),
        responseType: AuthSession.ResponseType.Code,
        state: 'github_signin',
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://github.com/login/oauth/authorize',
      });

      if (result.type !== 'success') {
        throw new Error('GitHub sign-in was cancelled or failed');
      }

      // Exchange authorization code for access token
      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: process.env.GITHUB_CLIENT_ID,
          code: result.params.code,
          redirectUri: request.redirectUri,
          extraParams: {
            client_secret: process.env.GITHUB_CLIENT_SECRET,
          },
        },
        {
          tokenEndpoint: 'https://github.com/login/oauth/access_token',
        }
      );

      // Create GitHub credential for Firebase (if supported)
      // Note: Firebase doesn't natively support GitHub, so this would require custom auth
      const customToken = await this.exchangeGitHubTokenForFirebaseToken(tokenResponse.accessToken);
      
      const userCredential = await auth().signInWithCustomToken(customToken);
      const userProfile = await this.createUserProfileFromFirebase(userCredential.user);

      await this.syncUserProfileWithBackend(userProfile);

      return userProfile;
    } catch (error) {
      console.error('GitHub sign-in error:', error);
      this.updateAuthState({ 
        isLoading: false, 
        lastError: 'GitHub sign-in failed. Please try again.' 
      });
      throw error;
    }
  }

  /**
   * Send email verification to current user
   * Handles email verification flow with custom action URL
   */
  async sendEmailVerification(config?: EmailVerificationConfig): Promise<void> {
    try {
      const user = auth().currentUser;
      if (!user) {
        throw new Error('No authenticated user found');
      }

      if (user.emailVerified) {
        throw new Error('Email is already verified');
      }

      const actionCodeSettings = config?.actionCodeSettings || {
        url: 'https://rapidtriage.com/auth/verify-email',
        handleCodeInApp: true,
      };

      await user.sendEmailVerification(actionCodeSettings);
      console.log('Email verification sent successfully');
    } catch (error) {
      console.error('Email verification error:', error);
      throw new Error('Failed to send email verification');
    }
  }

  /**
   * Send password reset email
   * Handles password reset flow with custom action URL
   */
  async sendPasswordResetEmail(request: PasswordResetRequest): Promise<void> {
    try {
      if (!request.email) {
        throw new Error('Email address is required');
      }

      const actionCodeSettings = request.actionCodeSettings || {
        url: 'https://rapidtriage.com/auth/reset-password',
        handleCodeInApp: true,
      };

      await auth().sendPasswordResetEmail(request.email, actionCodeSettings);
      console.log('Password reset email sent successfully');
    } catch (error) {
      console.error('Password reset error:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Update user profile information
   * Syncs changes with Firebase and backend API
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const user = auth().currentUser;
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Update Firebase profile
      const profileUpdates: any = {};
      if (updates.displayName) profileUpdates.displayName = updates.displayName;
      if (updates.photoURL) profileUpdates.photoURL = updates.photoURL;

      if (Object.keys(profileUpdates).length > 0) {
        await user.updateProfile(profileUpdates);
      }

      // Update email separately if changed
      if (updates.email && updates.email !== user.email) {
        await user.updateEmail(updates.email);
        // Send new email verification
        await this.sendEmailVerification();
      }

      // Create updated profile
      const updatedProfile = await this.createUserProfileFromFirebase(user);

      // Sync with backend
      await this.syncUserProfileWithBackend(updatedProfile);

      return updatedProfile;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  /**
   * Change user password
   * Requires current password for security verification
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = auth().currentUser;
      if (!user || !user.email) {
        throw new Error('No authenticated user found');
      }

      if (newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters long');
      }

      // Re-authenticate user with current password
      const credential = auth.EmailAuthProvider.credential(user.email, currentPassword);
      await user.reauthenticateWithCredential(credential);

      // Update password
      await user.updatePassword(newPassword);

      console.log('Password updated successfully');
    } catch (error) {
      console.error('Password change error:', error);
      throw new Error('Failed to change password. Please verify your current password.');
    }
  }

  /**
   * Sign out current user
   * Clears all stored authentication data
   */
  async logout(): Promise<void> {
    try {
      this.updateAuthState({ isLoading: true });

      // Sign out from Firebase
      await auth().signOut();

      // Clear stored tokens and user data
      await this.clearStoredTokens();

      console.log('User signed out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Get current access token
   * Returns cached token or refreshes if expired
   */
  async getAccessToken(): Promise<string | null> {
    try {
      // Try to get token from secure storage first
      const storedToken = await SecureStore.getItemAsync(this.STORAGE_KEYS.ACCESS_TOKEN);
      const expiresAt = await SecureStore.getItemAsync(this.STORAGE_KEYS.TOKEN_EXPIRES_AT);

      if (storedToken && expiresAt) {
        const expirationDate = new Date(expiresAt);
        if (expirationDate > new Date()) {
          return storedToken;
        }
      }

      // Token is expired or doesn't exist, refresh it
      const user = auth().currentUser;
      if (user) {
        const newToken = await user.getIdToken(true); // Force refresh
        const tokenResult = await user.getIdTokenResult();
        
        // Store new token
        await SecureStore.setItemAsync(this.STORAGE_KEYS.ACCESS_TOKEN, newToken);
        await SecureStore.setItemAsync(
          this.STORAGE_KEYS.TOKEN_EXPIRES_AT, 
          tokenResult.expirationTime
        );

        return newToken;
      }

      return null;
    } catch (error) {
      console.error('Token retrieval error:', error);
      return null;
    }
  }

  /**
   * Refresh authentication tokens
   * Forces token refresh from Firebase
   */
  async refreshToken(): Promise<AuthTokens | null> {
    try {
      const user = auth().currentUser;
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const tokens = await this.getTokensFromFirebase(user, true);
      await this.storeTokensSecurely(tokens);

      return tokens;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Get current authentication state
   * Returns the current auth state snapshot
   */
  getCurrentAuthState(): AuthState {
    return { ...this.currentAuthState };
  }

  /**
   * Subscribe to authentication state changes
   * Allows components to listen for auth state updates
   */
  onAuthStateChanged(callback: (state: AuthState) => void): () => void {
    this.authStateListeners.push(callback);
    
    // Immediately call callback with current state
    callback(this.currentAuthState);

    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Check if user is currently authenticated
   * Simple boolean check for authentication status
   */
  isAuthenticated(): boolean {
    return this.currentAuthState.isAuthenticated;
  }

  /**
   * Get current user profile
   * Returns user profile or null if not authenticated
   */
  getCurrentUser(): UserProfile | null {
    return this.currentAuthState.user;
  }

  // Private helper methods

  private async createUserProfileFromFirebase(firebaseUser: FirebaseAuthTypes.User): Promise<UserProfile> {
    // Determine the authentication provider used
    let provider = AuthProvider.EMAIL;
    if (firebaseUser.providerData.length > 0) {
      const providerId = firebaseUser.providerData[0].providerId;
      switch (providerId) {
        case 'google.com':
          provider = AuthProvider.GOOGLE;
          break;
        case 'apple.com':
          provider = AuthProvider.APPLE;
          break;
        case 'github.com':
          provider = AuthProvider.GITHUB;
          break;
        default:
          provider = AuthProvider.EMAIL;
      }
    }

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || undefined,
      photoURL: firebaseUser.photoURL || undefined,
      phoneNumber: firebaseUser.phoneNumber || undefined,
      emailVerified: firebaseUser.emailVerified,
      provider,
      createdAt: firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime) : new Date(),
      lastLoginAt: firebaseUser.metadata.lastSignInTime ? new Date(firebaseUser.metadata.lastSignInTime) : new Date(),
    };
  }

  private async getTokensFromFirebase(firebaseUser: FirebaseAuthTypes.User, forceRefresh = false): Promise<AuthTokens> {
    const idToken = await firebaseUser.getIdToken(forceRefresh);
    const tokenResult = await firebaseUser.getIdTokenResult(forceRefresh);
    
    return {
      accessToken: idToken,
      refreshToken: firebaseUser.refreshToken || '',
      expiresAt: new Date(tokenResult.expirationTime),
      tokenType: 'Bearer'
    };
  }

  private async storeTokensSecurely(tokens: AuthTokens): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(this.STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
      SecureStore.setItemAsync(this.STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
      SecureStore.setItemAsync(this.STORAGE_KEYS.TOKEN_EXPIRES_AT, tokens.expiresAt.toISOString())
    ]);
  }

  private async clearStoredTokens(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(this.STORAGE_KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(this.STORAGE_KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(this.STORAGE_KEYS.TOKEN_EXPIRES_AT),
      SecureStore.deleteItemAsync(this.STORAGE_KEYS.USER_PROFILE)
    ]);
  }

  private updateAuthState(updates: Partial<AuthState>): void {
    this.currentAuthState = { ...this.currentAuthState, ...updates };
    
    // Notify all listeners of the state change
    this.authStateListeners.forEach(callback => {
      try {
        callback(this.currentAuthState);
      } catch (error) {
        console.error('Auth state listener error:', error);
      }
    });
  }

  private async syncUserProfileWithBackend(userProfile: UserProfile): Promise<void> {
    try {
      await this.apiService.post('/users/sync', userProfile);
    } catch (error) {
      console.error('Backend sync error:', error);
      // Don't throw error here as it's not critical for auth flow
    }
  }

  private async updateLastLogin(userId: string): Promise<void> {
    try {
      await this.apiService.post(`/users/${userId}/last-login`);
    } catch (error) {
      console.error('Last login update error:', error);
      // Non-critical operation
    }
  }

  private async exchangeGitHubTokenForFirebaseToken(githubToken: string): Promise<string> {
    // This would typically be implemented on your backend
    // The backend would verify the GitHub token and create a Firebase custom token
    const response = await this.apiService.post('/auth/github/exchange', { 
      githubToken 
    });
    return response.firebaseToken;
  }

  private getAuthErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.';
      case 'auth/invalid-email':
        return 'Invalid email address format.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.';
      default:
        return 'Authentication failed. Please try again.';
    }
  }
}

// Create and export singleton instance
const authService = new AuthService(new (require('../api/api.service').ApiService)());
export { authService, AuthService };
export default authService;