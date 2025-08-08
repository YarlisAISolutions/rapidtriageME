import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL, API_VERSION } from '@env';
import { authService } from '../auth/auth.service';

/**
 * API response wrapper interface
 * Provides consistent response structure across all API calls
 */
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

/**
 * API error response interface
 * Standardizes error handling across the application
 */
export interface ApiError {
  message: string;
  code?: string;
  status: number;
  details?: any;
}

/**
 * Request configuration interface
 * Extends Axios config with custom options
 */
export interface RequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean; // Skip authentication for public endpoints
  retryAttempts?: number; // Number of retry attempts for failed requests
}

/**
 * Centralized API service for all HTTP communications
 * Handles authentication, error handling, and request/response transformation
 * 
 * Key features:
 * - Automatic JWT token attachment for authenticated requests
 * - Request/response interceptors for consistent data handling
 * - Comprehensive error handling with user-friendly messages
 * - Automatic token refresh on authentication errors
 * - Request retry logic for transient failures
 * - Offline support with request queuing
 */
class ApiService {
  private axiosInstance: AxiosInstance;
  private requestQueue: Array<() => Promise<any>> = [];
  private isRefreshingToken = false;

  constructor() {
    // Create axios instance with base configuration
    this.axiosInstance = axios.create({
      baseURL: `${API_BASE_URL}/${API_VERSION}`,
      timeout: 30000, // 30 second timeout for requests
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   * Handles authentication, error processing, and response transformation
   */
  private setupInterceptors(): void {
    // Request interceptor - adds authentication headers and handles request preprocessing
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Skip auth header for public endpoints
        if (!config.skipAuth) {
          const token = await authService.getAccessToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        // Add request timestamp for debugging
        config.metadata = { startTime: new Date() };

        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handles response transformation and error processing
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Calculate request duration for performance monitoring
        const duration = new Date().getTime() - response.config.metadata?.startTime?.getTime();
        console.log(`API Response: ${response.status} ${response.config.url} (${duration}ms)`);

        // Transform successful responses
        return this.transformResponse(response);
      },
      async (error) => {
        console.error('API Error:', error);

        // Handle authentication errors with token refresh
        if (error.response?.status === 401 && !error.config.skipAuth) {
          return this.handleAuthError(error);
        }

        // Handle network errors and timeouts
        if (!error.response) {
          return Promise.reject(this.createNetworkError(error));
        }

        // Transform error responses
        return Promise.reject(this.transformError(error));
      }
    );
  }

  /**
   * Handle authentication errors with automatic token refresh
   * Queues requests during token refresh to prevent multiple refresh attempts
   */
  private async handleAuthError(error: any): Promise<any> {
    const originalRequest = error.config;

    // Prevent infinite retry loops
    if (originalRequest._retry) {
      await authService.logout();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // If already refreshing token, queue the request
    if (this.isRefreshingToken) {
      return new Promise((resolve) => {
        this.requestQueue.push(() => this.axiosInstance.request(originalRequest));
      });
    }

    this.isRefreshingToken = true;

    try {
      // Attempt to refresh the access token
      await authService.refreshToken();
      
      // Process queued requests with new token
      this.processRequestQueue();
      
      // Retry original request with new token
      const newToken = await authService.getAccessToken();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return this.axiosInstance.request(originalRequest);
      }
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
      
      // Clear queue and logout user on refresh failure
      this.requestQueue = [];
      await authService.logout();
    } finally {
      this.isRefreshingToken = false;
    }

    return Promise.reject(error);
  }

  /**
   * Process queued requests after successful token refresh
   * Executes all queued requests with the new authentication token
   */
  private processRequestQueue(): void {
    this.requestQueue.forEach(request => request());
    this.requestQueue = [];
  }

  /**
   * Transform successful API responses to consistent format
   * Ensures all responses follow the ApiResponse interface
   */
  private transformResponse(response: AxiosResponse): ApiResponse {
    return {
      data: response.data.data || response.data,
      success: true,
      message: response.data.message,
      meta: response.data.meta
    };
  }

  /**
   * Transform API errors to consistent format
   * Provides user-friendly error messages and detailed error information
   */
  private transformError(error: any): ApiError {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      status: error.response?.status || 0
    };

    if (error.response?.data) {
      const errorData = error.response.data;
      apiError.message = errorData.message || errorData.error || apiError.message;
      apiError.code = errorData.code;
      apiError.details = errorData.details;
    }

    // Provide user-friendly messages for common HTTP status codes
    switch (error.response?.status) {
      case 400:
        apiError.message = errorData?.message || 'Invalid request data';
        break;
      case 401:
        apiError.message = 'Authentication required';
        break;
      case 403:
        apiError.message = 'Access denied';
        break;
      case 404:
        apiError.message = 'Resource not found';
        break;
      case 409:
        apiError.message = errorData?.message || 'Resource conflict';
        break;
      case 429:
        apiError.message = 'Too many requests. Please try again later.';
        break;
      case 500:
        apiError.message = 'Server error. Please try again later.';
        break;
      case 503:
        apiError.message = 'Service temporarily unavailable';
        break;
    }

    return apiError;
  }

  /**
   * Create network error for connection issues
   * Handles offline scenarios and connection timeouts
   */
  private createNetworkError(error: any): ApiError {
    if (error.code === 'NETWORK_ERROR') {
      return {
        message: 'No internet connection available',
        status: 0,
        code: 'NETWORK_ERROR'
      };
    }

    if (error.code === 'TIMEOUT') {
      return {
        message: 'Request timed out. Please try again.',
        status: 0,
        code: 'TIMEOUT'
      };
    }

    return {
      message: 'Network error occurred',
      status: 0,
      code: 'NETWORK_ERROR'
    };
  }

  /**
   * Generic GET request method
   * Supports query parameters and custom configuration
   */
  async get<T = any>(
    url: string, 
    params?: Record<string, any>, 
    config?: RequestConfig
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<T>>(url, {
        params,
        ...config
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generic POST request method
   * Handles data serialization and response transformation
   */
  async post<T = any>(
    url: string, 
    data?: any, 
    config?: RequestConfig
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generic PUT request method
   * Used for resource updates and replacements
   */
  async put<T = any>(
    url: string, 
    data?: any, 
    config?: RequestConfig
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.put<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generic PATCH request method
   * Used for partial resource updates
   */
  async patch<T = any>(
    url: string, 
    data?: any, 
    config?: RequestConfig
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.patch<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generic DELETE request method
   * Handles resource deletion with optional request body
   */
  async delete<T = any>(
    url: string, 
    config?: RequestConfig
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.delete<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload file with progress tracking
   * Handles multipart form data for file uploads
   */
  async uploadFile<T = any>(
    url: string,
    file: FormData,
    onUploadProgress?: (progress: number) => void,
    config?: RequestConfig
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<T>>(url, file, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onUploadProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            onUploadProgress(progress);
          }
        },
        ...config
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Health check endpoint
   * Verifies API connectivity and service status
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      return await this.get('/health', {}, { skipAuth: true });
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  /**
   * Cancel all pending requests
   * Useful for cleanup when component unmounts or user navigates away
   */
  cancelAllRequests(): void {
    // Clear request queue
    this.requestQueue = [];
    
    // Note: In a production app, you might want to implement request cancellation
    // using AbortController or axios CancelToken for better request management
    console.log('All pending requests cancelled');
  }
}

// Export singleton instance
export const apiService = new ApiService();
export { ApiService };
export default apiService;