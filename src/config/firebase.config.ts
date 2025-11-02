/**
 * Firebase Configuration
 * Central configuration for Firebase services
 */

export const firebaseConfig = {
  production: {
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || '',
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || ''
  },
  development: {
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || 'rapidtriage-dev',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || '',
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || ''
  }
};

export const getFirebaseConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return firebaseConfig[env as keyof typeof firebaseConfig] || firebaseConfig.development;
};

// Domain configuration
export const domainConfig = {
  production: {
    main: 'https://yarlis.com',
    studio: 'https://studio.yarlis.com',
    api: 'https://api.yarlis.com',
    auth: 'https://auth.yarlis.com'
  },
  development: {
    main: 'http://localhost:3000',
    studio: 'http://localhost:3001',
    api: 'http://localhost:5001',
    auth: 'http://localhost:9099'
  }
};

export const getDomainConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return domainConfig[env as keyof typeof domainConfig] || domainConfig.development;
};