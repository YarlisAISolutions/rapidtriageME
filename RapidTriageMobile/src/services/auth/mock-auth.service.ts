/**
 * Mock Authentication Service
 * Provides mock authentication functionality for testing and development
 * Simulates all auth flows without requiring actual Firebase or OAuth setup
 */

import * as SecureStore from 'expo-secure-store';
import { TestUtils } from '../../utils/test-config';
import {
  AuthProvider,
  UserProfile,
  AuthTokens,
  AuthState,
  PasswordResetRequest,
  EmailVerificationConfig
} from './auth.service';

/**
 * Mock user database for testing
 * Simulates a user store with predefined test users
 */
const MOCK_USERS = {
  'test@rapidtriage.com': {
    uid: 'test-user-001',
    email: 'test@rapidtriage.com',
    password: 'TestPass123!', // In real apps, this would be hashed
    displayName: 'Test User',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser',
    phoneNumber: '+1234567890',
    emailVerified: true,
    provider: AuthProvider.EMAIL,
    createdAt: new Date('2024-01-01'),
    lastLoginAt: new Date(),
    customClaims: { role: 'tester' }
  },
  'demo@rapidtriage.com': {
    uid: 'demo-user-001',
    email: 'demo@rapidtriage.com',
    password: 'DemoPass123!',
    displayName: 'Demo User',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demouser',
    phoneNumber: null,
    emailVerified: true,
    provider: AuthProvider.EMAIL,
    createdAt: new Date('2024-01-15'),
    lastLoginAt: new Date(),
    customClaims: { role: 'demo' }
  },
  'admin@rapidtriage.com': {
    uid: 'admin-user-001',
    email: 'admin@rapidtriage.com',
    password: 'AdminPass123!',
    displayName: 'Admin User',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=adminuser',
    phoneNumber: null,
    emailVerified: true,
    provider: AuthProvider.EMAIL,
    createdAt: new Date('2023-12-01'),
    lastLoginAt: new Date(),
    customClaims: { role: 'admin', permissions: ['read', 'write', 'admin'] }
  }
};

/**
 * Mock Authentication Service Class
 * Implements the same interface as the real auth service but with mock data
 */
export class MockAuthService {
  private authStateListeners: Array<(state: AuthState) => void> = [];
  private currentAuthState: AuthState = {
    user: null,
    tokens: null,
    isLoading: false,
    isAuthenticated: false,
    lastError: null
  };

  // Secure storage keys for mock token management
  private readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'mock_auth_access_token',
    REFRESH_TOKEN: 'mock_auth_refresh_token',
    TOKEN_EXPIRES_AT: 'mock_auth_token_expires_at',
    USER_PROFILE: 'mock_auth_user_profile'
  };

  constructor() {
    this.initializeMockAuth();
  }

  /**
   * Initialize mock authentication system
   * Sets up the mock auth state and auto-login if configured
   */
  private async initializeMockAuth(): Promise<void> {
    console.log('🧪 Initializing Mock Authentication Service');
    
    // Check if there's a stored user session
    const storedUser = await this.getStoredUser();
    if (storedUser) {
      await this.restoreUserSession(storedUser);
    }

    // Perform auto-login if configured
    if (TestUtils.shouldAutoLogin() && !this.isAuthenticated()) {
      const testUser = TestUtils.getTestUser();
      setTimeout(() => {
        this.signInWithEmail(testUser.email, testUser.password);
      }, 1000); // Delay to simulate app startup
    }
  }

  /**
   * Register new user with email and password (Mock)
   * Simulates user registration flow with validation
   */
  async registerWithEmail(
    email: string,
    password: string,
    displayName?: string
  ): Promise<UserProfile> {
    console.log('🧪 Mock Registration:', { email, displayName });
    
    this.updateAuthState({ isLoading: true, lastError: null });
    
    // Simulate network delay
    await TestUtils.createMockDelay('auth');

    try {
      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Check if user already exists
      if (MOCK_USERS[email as keyof typeof MOCK_USERS]) {
        throw new Error('An account with this email already exists');
      }

      // Create new mock user
      const newUser: UserProfile = {
        uid: 'user-' + Date.now(),
        email,
        displayName: displayName || email.split('@')[0],
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        phoneNumber: undefined,
        emailVerified: false,
        provider: AuthProvider.EMAIL,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      // Add to mock database
      (MOCK_USERS as any)[email] = {
        ...newUser,
        password // In real apps, this would be hashed
      };

      // Generate tokens
      const tokens = this.generateMockTokens(newUser.uid);
      
      // Store user data
      await this.storeUserSession(newUser, tokens);

      this.updateAuthState({
        user: newUser,
        tokens,
        isAuthenticated: true,
        isLoading: false,
        lastError: null
      });

      console.log('🧪 Mock Registration Success:', newUser.email);
      return newUser;
    } catch (error) {
      console.error('🧪 Mock Registration Error:', error);
      this.updateAuthState({
        isLoading: false,
        lastError: error instanceof Error ? error.message : 'Registration failed'
      });
      throw error;
    }
  }

  /**
   * Sign in user with email and password (Mock)
   * Simulates authentication flow with credential validation
   */
  async signInWithEmail(email: string, password: string): Promise<UserProfile> {
    console.log('🧪 Mock Sign In:', { email });
    
    this.updateAuthState({ isLoading: true, lastError: null });
    
    // Simulate network delay
    await TestUtils.createMockDelay('auth');

    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Find user in mock database
      const mockUser = MOCK_USERS[email as keyof typeof MOCK_USERS];
      if (!mockUser || mockUser.password !== password) {
        throw new Error('Invalid email or password');
      }

      // Create user profile
      const userProfile: UserProfile = {
        uid: mockUser.uid,
        email: mockUser.email,
        displayName: mockUser.displayName,
        photoURL: mockUser.photoURL,
        phoneNumber: mockUser.phoneNumber,
        emailVerified: mockUser.emailVerified,
        provider: mockUser.provider,
        createdAt: mockUser.createdAt,
        lastLoginAt: new Date(),
        customClaims: mockUser.customClaims
      };

      // Generate tokens
      const tokens = this.generateMockTokens(userProfile.uid);
      
      // Store user data
      await this.storeUserSession(userProfile, tokens);

      this.updateAuthState({
        user: userProfile,
        tokens,
        isAuthenticated: true,
        isLoading: false,
        lastError: null
      });

      console.log('🧪 Mock Sign In Success:', userProfile.email);
      return userProfile;
    } catch (error) {
      console.error('🧪 Mock Sign In Error:', error);
      this.updateAuthState({
        isLoading: false,
        lastError: error instanceof Error ? error.message : 'Sign in failed'
      });
      throw error;
    }
  }

  /**
   * Sign in with Google (Mock)
   * Simulates Google OAuth flow
   */
  async signInWithGoogle(): Promise<UserProfile> {
    console.log('🧪 Mock Google Sign In');
    
    this.updateAuthState({ isLoading: true, lastError: null });
    
    // Simulate OAuth delay
    await TestUtils.createMockDelay('auth');

    try {
      // Simulate successful Google authentication
      const googleUser: UserProfile = {
        uid: 'google-user-' + Date.now(),
        email: 'google.user@gmail.com',
        displayName: 'Google Test User',
        photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=googleuser',
        phoneNumber: undefined,
        emailVerified: true,
        provider: AuthProvider.GOOGLE,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      // Generate tokens
      const tokens = this.generateMockTokens(googleUser.uid);
      
      // Store user data
      await this.storeUserSession(googleUser, tokens);

      this.updateAuthState({
        user: googleUser,
        tokens,
        isAuthenticated: true,
        isLoading: false,
        lastError: null
      });

      console.log('🧪 Mock Google Sign In Success');
      return googleUser;
    } catch (error) {
      console.error('🧪 Mock Google Sign In Error:', error);
      this.updateAuthState({
        isLoading: false,
        lastError: 'Google sign-in failed'
      });
      throw error;
    }
  }

  /**
   * Sign in with Apple (Mock)
   * Simulates Apple Sign In flow
   */
  async signInWithApple(): Promise<UserProfile> {
    console.log('🧪 Mock Apple Sign In');
    
    this.updateAuthState({ isLoading: true, lastError: null });
    
    // Simulate OAuth delay
    await TestUtils.createMockDelay('auth');

    try {
      const appleUser: UserProfile = {
        uid: 'apple-user-' + Date.now(),
        email: 'apple.user@privaterelay.appleid.com',
        displayName: 'Apple Test User',
        photoURL: undefined, // Apple doesn't provide profile photos
        phoneNumber: undefined,
        emailVerified: true,
        provider: AuthProvider.APPLE,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      // Generate tokens
      const tokens = this.generateMockTokens(appleUser.uid);
      
      // Store user data
      await this.storeUserSession(appleUser, tokens);

      this.updateAuthState({
        user: appleUser,
        tokens,
        isAuthenticated: true,
        isLoading: false,
        lastError: null
      });

      console.log('🧪 Mock Apple Sign In Success');
      return appleUser;
    } catch (error) {
      console.error('🧪 Mock Apple Sign In Error:', error);
      this.updateAuthState({
        isLoading: false,
        lastError: 'Apple sign-in failed'
      });
      throw error;
    }
  }

  /**
   * Sign in with GitHub (Mock)
   * Simulates GitHub OAuth flow
   */
  async signInWithGitHub(): Promise<UserProfile> {
    console.log('🧪 Mock GitHub Sign In');
    
    this.updateAuthState({ isLoading: true, lastError: null });
    
    // Simulate OAuth delay
    await TestUtils.createMockDelay('auth');

    try {
      const githubUser: UserProfile = {
        uid: 'github-user-' + Date.now(),
        email: 'github.user@users.noreply.github.com',
        displayName: 'GitHub Test User',
        photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=githubuser',
        phoneNumber: undefined,
        emailVerified: true,
        provider: AuthProvider.GITHUB,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      // Generate tokens
      const tokens = this.generateMockTokens(githubUser.uid);
      
      // Store user data
      await this.storeUserSession(githubUser, tokens);

      this.updateAuthState({
        user: githubUser,
        tokens,
        isAuthenticated: true,
        isLoading: false,
        lastError: null
      });

      console.log('🧪 Mock GitHub Sign In Success');
      return githubUser;
    } catch (error) {
      console.error('🧪 Mock GitHub Sign In Error:', error);
      this.updateAuthState({
        isLoading: false,
        lastError: 'GitHub sign-in failed'
      });
      throw error;
    }
  }

  /**
   * Send email verification (Mock)
   * Simulates sending verification email
   */
  async sendEmailVerification(_config?: EmailVerificationConfig): Promise<void> {
    console.log('🧪 Mock Email Verification Sent');
    await TestUtils.createMockDelay('api');
    
    if (!this.currentAuthState.user) {
      throw new Error('No authenticated user found');
    }

    // In mock mode, we'll just update the user to be verified after a delay
    setTimeout(() => {
      if (this.currentAuthState.user) {
        const updatedUser = { ...this.currentAuthState.user, emailVerified: true };
        this.updateAuthState({ user: updatedUser });
      }
    }, 2000);
  }

  /**
   * Send password reset email (Mock)
   * Simulates password reset flow
   */
  async sendPasswordResetEmail(request: PasswordResetRequest): Promise<void> {
    console.log('🧪 Mock Password Reset Email Sent to:', request.email);
    await TestUtils.createMockDelay('api');
    
    // In a real app, this would send an actual email
    // In mock mode, we just simulate the process
  }

  /**
   * Update user profile (Mock)
   * Simulates profile updates
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    console.log('🧪 Mock Profile Update:', updates);
    
    if (!this.currentAuthState.user) {
      throw new Error('No authenticated user found');
    }

    await TestUtils.createMockDelay('api');

    const updatedUser = { ...this.currentAuthState.user, ...updates };
    this.updateAuthState({ user: updatedUser });

    return updatedUser;
  }

  /**
   * Change password (Mock)
   * Simulates password change flow
   */
  async changePassword(_currentPassword: string, newPassword: string): Promise<void> {
    console.log('🧪 Mock Password Change');
    
    if (!this.currentAuthState.user) {
      throw new Error('No authenticated user found');
    }

    await TestUtils.createMockDelay('api');

    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long');
    }

    // In mock mode, we simulate successful password change
    console.log('🧪 Mock Password Changed Successfully');
  }

  /**
   * Logout (Mock)
   * Clears authentication state and stored data
   */
  async logout(): Promise<void> {
    console.log('🧪 Mock Logout');
    
    this.updateAuthState({ isLoading: true });

    try {
      // Clear stored data
      await this.clearStoredData();

      this.updateAuthState({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        lastError: null
      });

      console.log('🧪 Mock Logout Success');
    } catch (error) {
      console.error('🧪 Mock Logout Error:', error);
      throw error;
    }
  }

  /**
   * Get access token (Mock)
   * Returns mock access token
   */
  async getAccessToken(): Promise<string | null> {
    if (!this.isAuthenticated()) {
      return null;
    }

    // Return stored token or generate new one
    const storedToken = await SecureStore.getItemAsync(this.STORAGE_KEYS.ACCESS_TOKEN);
    if (storedToken) {
      return storedToken;
    }

    // Generate new token if user is authenticated
    if (this.currentAuthState.user) {
      const tokens = this.generateMockTokens(this.currentAuthState.user.uid);
      await this.storeTokens(tokens);
      return tokens.accessToken;
    }

    return null;
  }

  /**
   * Refresh token (Mock)
   * Simulates token refresh
   */
  async refreshToken(): Promise<AuthTokens | null> {
    if (!this.currentAuthState.user) {
      return null;
    }

    console.log('🧪 Mock Token Refresh');
    const tokens = this.generateMockTokens(this.currentAuthState.user.uid);
    await this.storeTokens(tokens);

    this.updateAuthState({ tokens });
    return tokens;
  }

  /**
   * Get current authentication state
   */
  getCurrentAuthState(): AuthState {
    return { ...this.currentAuthState };
  }

  /**
   * Subscribe to authentication state changes
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
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentAuthState.isAuthenticated;
  }

  /**
   * Get current user profile
   */
  getCurrentUser(): UserProfile | null {
    return this.currentAuthState.user;
  }

  // Private helper methods

  private generateMockTokens(userId: string): AuthTokens {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

    return {
      accessToken: `mock_access_token_${userId}_${Date.now()}`,
      refreshToken: `mock_refresh_token_${userId}_${Date.now()}`,
      expiresAt,
      tokenType: 'Bearer'
    };
  }

  private async storeUserSession(user: UserProfile, tokens: AuthTokens): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(this.STORAGE_KEYS.USER_PROFILE, JSON.stringify(user)),
      this.storeTokens(tokens)
    ]);
  }

  private async storeTokens(tokens: AuthTokens): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(this.STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
      SecureStore.setItemAsync(this.STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
      SecureStore.setItemAsync(this.STORAGE_KEYS.TOKEN_EXPIRES_AT, tokens.expiresAt.toISOString())
    ]);
  }

  private async getStoredUser(): Promise<UserProfile | null> {
    try {
      const storedUserData = await SecureStore.getItemAsync(this.STORAGE_KEYS.USER_PROFILE);
      if (storedUserData) {
        return JSON.parse(storedUserData);
      }
    } catch (error) {
      console.error('🧪 Error retrieving stored user:', error);
    }
    return null;
  }

  private async restoreUserSession(user: UserProfile): Promise<void> {
    const storedToken = await SecureStore.getItemAsync(this.STORAGE_KEYS.ACCESS_TOKEN);
    const storedRefreshToken = await SecureStore.getItemAsync(this.STORAGE_KEYS.REFRESH_TOKEN);
    const storedExpiresAt = await SecureStore.getItemAsync(this.STORAGE_KEYS.TOKEN_EXPIRES_AT);

    if (storedToken && storedRefreshToken && storedExpiresAt) {
      const tokens: AuthTokens = {
        accessToken: storedToken,
        refreshToken: storedRefreshToken,
        expiresAt: new Date(storedExpiresAt),
        tokenType: 'Bearer'
      };

      this.updateAuthState({
        user,
        tokens,
        isAuthenticated: true,
        isLoading: false,
        lastError: null
      });
    }
  }

  private async clearStoredData(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(this.STORAGE_KEYS.ACCESS_TOKEN).catch(() => {}),
      SecureStore.deleteItemAsync(this.STORAGE_KEYS.REFRESH_TOKEN).catch(() => {}),
      SecureStore.deleteItemAsync(this.STORAGE_KEYS.TOKEN_EXPIRES_AT).catch(() => {}),
      SecureStore.deleteItemAsync(this.STORAGE_KEYS.USER_PROFILE).catch(() => {})
    ]);
  }

  private updateAuthState(updates: Partial<AuthState>): void {
    this.currentAuthState = { ...this.currentAuthState, ...updates };
    
    // Notify all listeners
    this.authStateListeners.forEach(callback => {
      try {
        callback(this.currentAuthState);
      } catch (error) {
        console.error('🧪 Mock auth state listener error:', error);
      }
    });
  }
}

// Create and export singleton instance
export const mockAuthService = new MockAuthService();