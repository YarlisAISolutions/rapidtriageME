/**
 * Cleanup Expired Sessions Scheduled Function
 * Runs hourly to clean up expired and stale sessions
 */

import { onSchedule, ScheduleOptions } from 'firebase-functions/v2/scheduler';
import { sessionService } from '../services/session.service.js';
import { getFirestore, Collections } from '../config/firebase.config.js';
import * as admin from 'firebase-admin';

/**
 * Scheduled function options
 */
const options: ScheduleOptions = {
  region: 'us-central1',
  schedule: '0 * * * *', // Run every hour
  timeZone: 'UTC',
  memory: '256MiB',
  timeoutSeconds: 300, // 5 minutes
  retryCount: 2,
};

/**
 * Cleanup stale sessions (no activity for 2+ hours)
 */
async function cleanupStaleSessions(): Promise<number> {
  const db = getFirestore();
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const snapshot = await db
    .collection(Collections.SESSIONS)
    .where('status', '==', 'active')
    .where('lastActivity', '<', twoHoursAgo)
    .limit(200)
    .get();

  if (snapshot.empty) {
    return 0;
  }

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, {
      status: 'idle',
      markedIdleAt: new Date().toISOString(),
    });
  });

  await batch.commit();
  return snapshot.size;
}

/**
 * Delete old disconnected sessions (older than 7 days)
 */
async function deleteOldSessions(): Promise<number> {
  const db = getFirestore();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const snapshot = await db
    .collection(Collections.SESSIONS)
    .where('status', 'in', ['disconnected', 'expired'])
    .where('createdAt', '<', sevenDaysAgo)
    .limit(200)
    .get();

  if (snapshot.empty) {
    return 0;
  }

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  return snapshot.size;
}

/**
 * Log cleanup results to Firestore
 */
async function logCleanupResults(results: {
  expiredCount: number;
  staleCount: number;
  deletedCount: number;
  duration: number;
  errors: string[];
}): Promise<void> {
  const db = getFirestore();
  await db.collection(Collections.AUDIT_LOGS).add({
    type: 'scheduled_cleanup',
    target: 'sessions',
    ...results,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Cleanup expired sessions scheduled function
 */
export const cleanupExpiredSessions = onSchedule(options, async (event) => {
  console.log('Starting cleanup of expired sessions...');
  const startTime = Date.now();
  const errors: string[] = [];
  let expiredCount = 0;
  let staleCount = 0;
  let deletedCount = 0;

  try {
    // 1. Mark expired sessions
    expiredCount = await sessionService.cleanupExpiredSessions();
    console.log(`Marked ${expiredCount} sessions as expired`);

    // 2. Mark stale sessions as idle
    staleCount = await cleanupStaleSessions();
    console.log(`Marked ${staleCount} stale sessions as idle`);

    // 3. Delete old disconnected/expired sessions
    deletedCount = await deleteOldSessions();
    console.log(`Deleted ${deletedCount} old sessions`);

    const duration = Date.now() - startTime;
    console.log(`Session cleanup completed in ${duration}ms`);

    // Log results
    await logCleanupResults({
      expiredCount,
      staleCount,
      deletedCount,
      duration,
      errors,
    });
  } catch (error) {
    console.error('Session cleanup error:', error);
    errors.push(error instanceof Error ? error.message : 'Unknown error');

    // Log error results
    await logCleanupResults({
      expiredCount,
      staleCount,
      deletedCount,
      duration: Date.now() - startTime,
      errors,
    });

    throw error; // Re-throw to trigger retry
  }
});
