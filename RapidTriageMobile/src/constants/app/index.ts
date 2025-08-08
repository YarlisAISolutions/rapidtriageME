/**
 * App-wide constants and configuration values
 * These constants define core app behavior and settings
 */

export const APP_CONFIG = {
  NAME: 'RapidTriage',
  VERSION: '1.0.0',
  COMPANY: 'YarlisAI Solutions',
  SUPPORT_EMAIL: 'support@rapidtriage.com',
} as const;

export const SUBSCRIPTION_TIERS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    features: [
      'Basic triage reports',
      'Up to 10 scans per month',
      'Community support',
      'Basic debugging tools'
    ],
    maxScansPerMonth: 10,
    supportLevel: 'community'
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 29,
    features: [
      'Advanced triage reports',
      'Unlimited scans',
      'Priority support',
      'Advanced debugging tools',
      'Performance insights',
      'API access'
    ],
    maxScansPerMonth: -1, // unlimited
    supportLevel: 'priority'
  },
  TEAM: {
    id: 'team',
    name: 'Team',
    price: 99,
    features: [
      'Everything in Pro',
      'Team collaboration',
      'Advanced analytics',
      'Custom integrations',
      'Dedicated support',
      'SSO integration'
    ],
    maxScansPerMonth: -1, // unlimited
    supportLevel: 'dedicated'
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: null, // custom pricing
    features: [
      'Everything in Team',
      'On-premise deployment',
      'Custom development',
      'SLA guarantees',
      'Training & onboarding',
      '24/7 support'
    ],
    maxScansPerMonth: -1, // unlimited
    supportLevel: 'enterprise'
  }
} as const;

export const NAVIGATION_ROUTES = {
  // Root
  SPLASH: 'Splash',
  
  // Onboarding
  ONBOARDING: 'Onboarding',
  WELCOME: 'Welcome',
  
  // Authentication
  AUTH: 'Auth',
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  
  // Main App
  MAIN: 'Main',
  HOME: 'Home',
  DASHBOARD: 'Dashboard',
  SCAN: 'Scan',
  REPORTS: 'Reports',
  
  // Settings
  SETTINGS: 'Settings',
  PROFILE: 'Profile',
  SUBSCRIPTION: 'Subscription',
  NOTIFICATIONS: 'Notifications',
  HELP: 'Help'
} as const;

export const STORAGE_KEYS = {
  USER_TOKEN: 'user_token',
  USER_PROFILE: 'user_profile',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  SETTINGS: 'app_settings',
  LAST_SYNC: 'last_sync'
} as const;