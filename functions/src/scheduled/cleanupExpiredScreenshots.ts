/**
 * Cleanup Expired Screenshots Scheduled Function
 * Runs daily to remove expired screenshots from storage
 */

import { onSchedule, ScheduleOptions } from 'firebase-functions/v2/scheduler';
import { screenshotService } from '../services/screenshot.service.js';
import { getFirestore, Collections } from '../config/firebase.config.js';

/**
 * Scheduled function options
 */
const options: ScheduleOptions = {
  region: 'us-central1',
  schedule: '0 2 * * *', // Run at 2 AM daily
  timeZone: 'America/New_York',
  memory: '512MiB',
  timeoutSeconds: 540, // 9 minutes
  retryCount: 3,
};

/**
 * Log cleanup results to Firestore
 */
async function logCleanupResults(
  type: string,
  deletedCount: number,
  duration: number,
  errors: string[]
): Promise<void> {
  const db = getFirestore();
  await db.collection(Collections.AUDIT_LOGS).add({
    type: 'scheduled_cleanup',
    target: type,
    deletedCount,
    duration,
    errors,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Cleanup expired screenshots scheduled function
 */
export const cleanupExpiredScreenshots = onSchedule(options, async (event) => {
  console.log('Starting cleanup of expired screenshots...');
  const startTime = Date.now();
  const errors: string[] = [];
  let totalDeleted = 0;

  try {
    // Run cleanup in batches
    let batchCount = 0;
    const maxBatches = 10; // Limit to prevent timeout

    while (batchCount < maxBatches) {
      const deleted = await screenshotService.cleanupExpiredScreenshots();

      if (deleted === 0) {
        break; // No more expired screenshots
      }

      totalDeleted += deleted;
      batchCount++;

      console.log(`Batch ${batchCount}: Deleted ${deleted} expired screenshots`);

      // Check if we're running low on time (leave 1 minute buffer)
      if (Date.now() - startTime > 480000) {
        console.log('Approaching timeout, stopping cleanup');
        break;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`Cleanup completed: ${totalDeleted} screenshots deleted in ${duration}ms`);

    // Log results
    await logCleanupResults('screenshots', totalDeleted, duration, errors);
  } catch (error) {
    console.error('Screenshot cleanup error:', error);
    errors.push(error instanceof Error ? error.message : 'Unknown error');

    // Log error results
    await logCleanupResults('screenshots', totalDeleted, Date.now() - startTime, errors);

    throw error; // Re-throw to trigger retry
  }
});
