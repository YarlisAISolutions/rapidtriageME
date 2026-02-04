/**
 * On Screenshot Created Background Trigger
 * Triggered when a new screenshot document is created in Firestore
 */

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { getFirestore, Collections } from '../config/firebase.config.js';

/**
 * Screenshot metadata interface
 */
interface ScreenshotData {
  id: string;
  path: string;
  pageUrl: string;
  pageTitle: string;
  uploadedBy?: string;
  tenant: {
    type: string;
    identifier: string;
  };
  project?: string;
  session?: {
    id: string;
  };
  size: number;
  uploadedAt: string;
}

/**
 * Document path for the trigger
 */
const documentPath = `${Collections.SCREENSHOTS}/{screenshotId}`;

/**
 * On Screenshot Created trigger
 */
export const onScreenshotCreated = onDocumentCreated(
  {
    document: documentPath,
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log('No data in snapshot');
      return;
    }

    const screenshotId = event.params.screenshotId;
    const data = snapshot.data() as ScreenshotData;

    console.log(`Processing new screenshot: ${screenshotId}`);

    const db = getFirestore();

    try {
      // 1. Update user screenshot count
      if (data.uploadedBy) {
        await db.collection(Collections.USERS).doc(data.uploadedBy).update({
          screenshotCount: admin.firestore.FieldValue.increment(1),
          lastScreenshotAt: data.uploadedAt,
        });
        console.log(`Updated screenshot count for user: ${data.uploadedBy}`);
      }

      // 2. Update tenant storage usage
      const tenantId = data.tenant?.identifier || 'anonymous';
      const tenantType = data.tenant?.type || 'public';
      const tenantKey = `tenant:${tenantType}:${tenantId}`;

      await db.collection(Collections.METRICS).doc(tenantKey).set({
        type: tenantType,
        identifier: tenantId,
        screenshotCount: admin.firestore.FieldValue.increment(1),
        totalSize: admin.firestore.FieldValue.increment(data.size || 0),
        lastUpdated: new Date().toISOString(),
      }, { merge: true });
      console.log(`Updated tenant metrics: ${tenantKey}`);

      // 3. Update project metrics if applicable
      if (data.project) {
        const projectKey = `project:${tenantId}:${data.project}`;
        await db.collection(Collections.METRICS).doc(projectKey).set({
          tenantId,
          project: data.project,
          screenshotCount: admin.firestore.FieldValue.increment(1),
          totalSize: admin.firestore.FieldValue.increment(data.size || 0),
          lastUpdated: new Date().toISOString(),
        }, { merge: true });
        console.log(`Updated project metrics: ${projectKey}`);
      }

      // 4. Update session screenshot count if applicable
      if (data.session?.id) {
        await db.collection(Collections.SESSIONS).doc(data.session.id).update({
          'logs.screenshotCount': admin.firestore.FieldValue.increment(1),
          lastActivity: new Date().toISOString(),
        }).catch(err => {
          // Session might not exist
          console.log(`Could not update session ${data.session?.id}: ${err.message}`);
        });
      }

      // 5. Track daily screenshot metrics
      const today = new Date().toISOString().split('T')[0];
      await db.collection(Collections.METRICS).doc(`screenshots:${today}`).set({
        date: today,
        count: admin.firestore.FieldValue.increment(1),
        totalSize: admin.firestore.FieldValue.increment(data.size || 0),
        lastUpdated: new Date().toISOString(),
      }, { merge: true });

      // 6. Create audit log entry
      await db.collection(Collections.AUDIT_LOGS).add({
        type: 'screenshot_created',
        resourceId: screenshotId,
        userId: data.uploadedBy || 'anonymous',
        tenantId,
        project: data.project,
        pageUrl: data.pageUrl,
        size: data.size,
        timestamp: new Date().toISOString(),
      });

      console.log(`Screenshot processing completed: ${screenshotId}`);
    } catch (error) {
      console.error(`Error processing screenshot ${screenshotId}:`, error);
      throw error; // Re-throw to trigger retry
    }
  }
);
