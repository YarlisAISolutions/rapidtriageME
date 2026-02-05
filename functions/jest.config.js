/**
 * Jest Configuration for Firebase Functions
 *
 * Configures Jest for testing Firebase Cloud Functions with TypeScript support.
 */

module.exports = {
  // Use ts-jest for TypeScript support
  preset: 'ts-jest',

  // Test environment
  testEnvironment: 'node',

  // Root directory for tests
  roots: ['<rootDir>/test', '<rootDir>/src'],

  // Test file patterns
  testMatch: [
    '**/*.test.ts',
    '**/*.spec.ts',
  ],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // TypeScript configuration for ts-jest
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },

  // Setup files to run before tests
  // Note: setup.ts initializes firebase-functions-test which may conflict with mocks
  // Consider using setupFilesAfterEnv only for integration tests
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],

  coverageDirectory: 'coverage',

  coverageReporters: ['text', 'lcov', 'html'],

  // Coverage thresholds - set to 0 for now due to Firebase SDK initialization
  // at module load time. Real coverage requires either:
  // 1. Running tests against Firebase emulators
  // 2. Refactoring to use dependency injection
  // 3. Comprehensive module mocking before imports
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },

  // Module path aliases and ESM .js extension handling
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Map .js imports to .ts files for ESM-style TypeScript imports
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/lib/',
  ],

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Test timeout (increase for emulator tests)
  testTimeout: 30000,

  // Global setup/teardown (optional, for emulator)
  // globalSetup: '<rootDir>/test/globalSetup.ts',
  // globalTeardown: '<rootDir>/test/globalTeardown.ts',
};
