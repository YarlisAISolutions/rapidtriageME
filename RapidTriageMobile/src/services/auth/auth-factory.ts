/**
 * Authentication Service Factory
 * Provides the appropriate authentication service based on the current environment
 * Handles switching between real Firebase auth and mock auth for testing
 */

import { TestUtils } from '../../utils/test-config';
import { AuthService } from './auth.service';
import { MockAuthService } from './mock-auth.service';
import { ApiService } from '../api/api.service';

/**
 * Authentication service interface
 * Defines the contract that both real and mock auth services must implement
 */
export interface IAuthService {
  // Authentication methods
  registerWithEmail(email: string, password: string, displayName?: string): Promise<any>;
  signInWithEmail(email: string, password: string): Promise<any>;
  signInWithGoogle(): Promise<any>;
  signInWithApple(): Promise<any>;
  signInWithGitHub(): Promise<any>;
  
  // User management
  sendEmailVerification(config?: any): Promise<void>;
  sendPasswordResetEmail(request: any): Promise<void>;
  updateProfile(updates: any): Promise<any>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
  logout(): Promise<void>;
  
  // Token management
  getAccessToken(): Promise<string | null>;
  refreshToken(): Promise<any>;
  
  // State management
  getCurrentAuthState(): any;
  onAuthStateChanged(callback: (state: any) => void): () => void;
  isAuthenticated(): boolean;
  getCurrentUser(): any;
}

/**
 * Create the appropriate authentication service instance
 * Returns mock service in test mode, real service otherwise
 */
function createAuthService(): IAuthService {
  if (TestUtils.shouldUseMockAuth()) {
    console.log('🧪 Using Mock Authentication Service');
    return new MockAuthService();
  } else {
    console.log('🔐 Using Real Authentication Service');
    // Create API service instance for real auth service
    const apiService = new (require('../api/api.service').ApiService)();
    return new AuthService(apiService);
  }
}

/**
 * Singleton authentication service instance
 * Automatically switches between real and mock based on configuration
 */
export const authService = createAuthService();

/**
 * Authentication service factory class
 * Provides methods to create and manage auth service instances
 */
export class AuthServiceFactory {
  private static instance: IAuthService | null = null;

  /**
   * Get the singleton auth service instance
   * Creates a new instance if none exists
   */
  static getInstance(): IAuthService {
    if (!AuthServiceFactory.instance) {
      AuthServiceFactory.instance = createAuthService();
    }
    return AuthServiceFactory.instance;
  }

  /**
   * Force create a new auth service instance
   * Useful for testing or when environment changes
   */
  static createNew(): IAuthService {
    AuthServiceFactory.instance = createAuthService();
    return AuthServiceFactory.instance;
  }

  /**
   * Reset the singleton instance
   * Forces creation of new instance on next access
   */
  static reset(): void {
    AuthServiceFactory.instance = null;
  }

  /**
   * Check if mock authentication is being used
   */
  static isMockMode(): boolean {
    return TestUtils.shouldUseMockAuth();
  }

  /**
   * Get authentication service type
   */
  static getServiceType(): 'mock' | 'real' {
    return TestUtils.shouldUseMockAuth() ? 'mock' : 'real';
  }
}

// Export the singleton instance as default
export default authService;