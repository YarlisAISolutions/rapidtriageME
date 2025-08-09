/**
 * Service Factory
 * Provides appropriate service instances based on the current environment
 * Handles switching between real services and mock services for testing
 */

import { TestUtils } from '../utils/test-config';

// Service imports - real services
import { ApiService } from './api/api.service';
import { AnalyticsService } from './analytics/analytics.service';

// Mock service imports  
import { mockApiService } from './api/mock-api.service';
import { mockAnalyticsService } from './analytics/mock-analytics.service';

/**
 * Service Factory Class
 * Creates appropriate service instances based on test configuration
 */
export class ServiceFactory {
  private static apiServiceInstance: any = null;
  private static analyticsServiceInstance: any = null;

  /**
   * Get API Service instance
   * Returns mock service in test mode, real service otherwise
   */
  static getApiService(): any {
    if (!ServiceFactory.apiServiceInstance) {
      if (TestUtils.shouldUseMockAPI()) {
        console.log('🧪 Using Mock API Service');
        ServiceFactory.apiServiceInstance = mockApiService;
      } else {
        console.log('🌐 Using Real API Service');
        ServiceFactory.apiServiceInstance = new ApiService();
      }
    }
    return ServiceFactory.apiServiceInstance;
  }

  /**
   * Get Analytics Service instance
   * Returns mock service in test mode, real service otherwise
   */
  static getAnalyticsService(): any {
    if (!ServiceFactory.analyticsServiceInstance) {
      if (TestUtils.isTestMode()) {
        console.log('🧪 Using Mock Analytics Service');
        ServiceFactory.analyticsServiceInstance = mockAnalyticsService;
      } else {
        console.log('📊 Using Real Analytics Service');
        ServiceFactory.analyticsServiceInstance = new AnalyticsService();
      }
    }
    return ServiceFactory.analyticsServiceInstance;
  }

  /**
   * Reset all service instances
   * Forces creation of new instances on next access
   */
  static resetAll(): void {
    ServiceFactory.apiServiceInstance = null;
    ServiceFactory.analyticsServiceInstance = null;
  }

  /**
   * Get service configuration info
   * Returns which services are being used (mock vs real)
   */
  static getServiceConfig(): {
    apiService: 'mock' | 'real';
    analyticsService: 'mock' | 'real';
    testMode: boolean;
  } {
    return {
      apiService: TestUtils.shouldUseMockAPI() ? 'mock' : 'real',
      analyticsService: TestUtils.isTestMode() ? 'mock' : 'real',
      testMode: TestUtils.isTestMode()
    };
  }

  /**
   * Initialize all services
   * Sets up services based on current configuration
   */
  static async initializeServices(): Promise<void> {
    console.log('🏭 Initializing services with configuration:', ServiceFactory.getServiceConfig());
    
    try {
      // Initialize API service
      const apiService = ServiceFactory.getApiService();
      if (apiService.initialize) {
        await apiService.initialize();
      }

      // Initialize Analytics service
      const analyticsService = ServiceFactory.getAnalyticsService();
      if (analyticsService.initialize) {
        await analyticsService.initialize();
      }

      console.log('🏭 All services initialized successfully');
    } catch (error) {
      console.error('🏭 Service initialization error:', error);
      throw error;
    }
  }
}

// Export service instances for convenience
export const apiService = ServiceFactory.getApiService();
export const analyticsService = ServiceFactory.getAnalyticsService();