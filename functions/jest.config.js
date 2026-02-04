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
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],

  coverageDirectory: 'coverage',

  coverageReporters: ['text', 'lcov', 'html'],

  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Module path aliases (if needed)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
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
