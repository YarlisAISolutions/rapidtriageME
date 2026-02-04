/**
 * RapidTriageME Firebase Functions
 *
 * Main entry point for all Firebase Functions.
 * Exports HTTP triggers, callable functions, scheduled functions, and background triggers.
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();

// ============================================
// HTTP FUNCTIONS
// ============================================

// Health & Status
export { health } from './http/health.js';
export { status } from './http/status.js';
export { metrics } from './http/metrics.js';

// Authentication
export { auth } from './http/auth/index.js';

// API Endpoints
export { api } from './http/api/index.js';

// Documentation
export { apiDocs } from './http/docs/index.js';

// SSE/MCP
export { sse } from './http/mcp/sse.js';

// ============================================
// CALLABLE FUNCTIONS
// ============================================

export { createApiKey } from './callable/createApiKey.js';
export { revokeApiKey } from './callable/revokeApiKey.js';
export { captureScreenshot } from './callable/captureScreenshot.js';

// ============================================
// SCHEDULED FUNCTIONS
// ============================================

export { cleanupExpiredScreenshots } from './scheduled/cleanupExpiredScreenshots.js';
export { cleanupExpiredSessions } from './scheduled/cleanupExpiredSessions.js';
export { aggregateMetrics } from './scheduled/aggregateMetrics.js';

// ============================================
// BACKGROUND TRIGGERS
// ============================================

export { onScreenshotCreated } from './background/onScreenshotCreated.js';
export { onUserCreated } from './background/onUserCreated.js';
