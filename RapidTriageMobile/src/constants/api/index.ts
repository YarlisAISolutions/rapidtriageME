/**
 * API endpoints and configuration constants
 * Centralizes all API-related constants for maintainability
 */

import { API_BASE_URL, API_VERSION } from '@env';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL || 'https://api.rapidtriage.com',
  VERSION: API_VERSION || 'v1',
  TIMEOUT: 30000, // 30 seconds
} as const;

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email'
  },
  
  // User Management
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    CHANGE_PASSWORD: '/user/change-password',
    DELETE_ACCOUNT: '/user/delete-account'
  },
  
  // Triage & Scanning
  TRIAGE: {
    START_SCAN: '/triage/scan',
    GET_REPORT: '/triage/report',
    LIST_REPORTS: '/triage/reports',
    DELETE_REPORT: '/triage/report'
  },
  
  // Subscription & Billing
  SUBSCRIPTION: {
    CURRENT: '/subscription/current',
    PLANS: '/subscription/plans',
    SUBSCRIBE: '/subscription/subscribe',
    CANCEL: '/subscription/cancel',
    BILLING_HISTORY: '/subscription/billing-history'
  },
  
  // Analytics & Usage
  ANALYTICS: {
    USAGE_STATS: '/analytics/usage',
    PERFORMANCE_METRICS: '/analytics/performance'
  }
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const;