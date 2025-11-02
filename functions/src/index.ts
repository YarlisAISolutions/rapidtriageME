/**
 * Firebase Cloud Functions Entry Point
 * Main entry for all Cloud Functions
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Express app
const app = express();

// Configure CORS for yarlis.com domains
const corsOptions = {
  origin: [
    'https://yarlis.com',
    'https://www.yarlis.com',
    'https://studio.yarlis.com',
    'https://api.yarlis.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5000'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Import API routes
import { authRoutes } from './api/auth';
import { screenshotRoutes } from './api/screenshot';
import { browserRoutes } from './api/browser';
import { mcpRoutes } from './api/mcp';
import { profileRoutes } from './api/profile';

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/screenshot', screenshotRoutes);
app.use('/api/browser', browserRoutes);
app.use('/api/mcp', mcpRoutes);
app.use('/api/profile', profileRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'RapidTriageME Firebase Functions',
    version: '1.0.0'
  });
});

// Main API endpoint
export const api = functions.https.onRequest(app);

// Authentication triggers
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  // Create user profile in Firestore
  const db = admin.firestore();

  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    subscription: {
      plan: 'free',
      status: 'active',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days trial
    },
    role: 'user',
    emailVerified: user.emailVerified
  });

  // Send welcome email (optional)
  console.log('New user created:', user.email);
});

export const onUserDelete = functions.auth.user().onDelete(async (user) => {
  // Clean up user data
  const db = admin.firestore();

  // Delete user profile
  await db.collection('users').doc(user.uid).delete();

  // Delete user's API keys
  const apiKeys = await db.collection('apiKeys')
    .where('userId', '==', user.uid)
    .get();

  const batch = db.batch();
  apiKeys.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  console.log('User deleted:', user.email);
});

// Firestore triggers
export const onProjectCreate = functions.firestore
  .document('projects/{projectId}')
  .onCreate(async (snap, context) => {
    const project = snap.data();
    const projectId = context.params.projectId;

    // Initialize project structure
    const db = admin.firestore();

    // Create default session
    await db.collection('projects').doc(projectId)
      .collection('sessions').add({
        name: 'Default Session',
        status: 'inactive',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

    console.log('Project created:', projectId);
  });

// Storage triggers
export const onScreenshotUpload = functions.storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name;
    const contentType = object.contentType;

    // Only process screenshots
    if (!filePath?.startsWith('screenshots/') || !contentType?.startsWith('image/')) {
      return;
    }

    // Extract metadata from path
    const pathParts = filePath.split('/');
    const userId = pathParts[1];
    const projectId = pathParts[2];

    // Update screenshot metadata in Firestore
    const db = admin.firestore();
    await db.collection('screenshots').add({
      path: filePath,
      userId,
      projectId,
      size: object.size,
      contentType,
      uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: object.metadata
    });

    console.log('Screenshot uploaded:', filePath);
  });

// Scheduled functions
export const dailyCleanup = functions.pubsub
  .schedule('0 2 * * *') // Run at 2 AM daily
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const db = admin.firestore();
    const storage = admin.storage();

    // Clean up old sessions (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const oldSessions = await db.collection('sessions')
      .where('createdAt', '<', sevenDaysAgo)
      .where('status', '==', 'inactive')
      .get();

    const batch = db.batch();
    oldSessions.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    // Clean up temporary files
    const bucket = storage.bucket();
    const [files] = await bucket.getFiles({
      prefix: 'temp/',
      delimiter: '/'
    });

    const deletePromises = files
      .filter(file => {
        const metadata = file.metadata;
        const createdTime = new Date(metadata.timeCreated);
        return createdTime < sevenDaysAgo;
      })
      .map(file => file.delete());

    await Promise.all(deletePromises);

    console.log('Daily cleanup completed');
  });

// Analytics aggregation
export const aggregateAnalytics = functions.pubsub
  .schedule('0 * * * *') // Run every hour
  .onRun(async (context) => {
    const db = admin.firestore();

    // Aggregate user metrics
    const hour = new Date();
    hour.setMinutes(0, 0, 0);

    const metrics = await db.collection('metrics')
      .where('timestamp', '>=', hour)
      .get();

    const aggregated: Record<string, any> = {};

    metrics.forEach(doc => {
      const data = doc.data();
      const metric = data.metric;

      if (!aggregated[metric]) {
        aggregated[metric] = {
          count: 0,
          sum: 0,
          values: []
        };
      }

      aggregated[metric].count++;
      aggregated[metric].sum += data.value;
      aggregated[metric].values.push(data.value);
    });

    // Store aggregated data
    for (const [metric, data] of Object.entries(aggregated)) {
      await db.collection('analytics').add({
        metric,
        hour,
        count: data.count,
        sum: data.sum,
        avg: data.sum / data.count,
        min: Math.min(...data.values),
        max: Math.max(...data.values),
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    console.log('Analytics aggregated for hour:', hour);
  });

// HTTP callable functions
export const verifyToken = functions.https.onCall(async (data, context) => {
  const { token } = data;

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return {
      valid: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
      claims: decodedToken
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid token'
    };
  }
});

export const createCustomToken = functions.https.onCall(async (data, context) => {
  // Check if request is authenticated and has admin role
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can create custom tokens'
    );
  }

  const { userId, claims } = data;

  try {
    const customToken = await admin.auth().createCustomToken(userId, claims);
    return { token: customToken };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Background job processor
export const processJob = functions.https.onCall(async (data, context) => {
  const { jobId } = data;

  const db = admin.firestore();
  const jobRef = db.collection('jobs').doc(jobId);
  const jobDoc = await jobRef.get();

  if (!jobDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Job not found');
  }

  const job = jobDoc.data();

  // Update job status to running
  await jobRef.update({
    status: 'running',
    startedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  try {
    // Process job based on type
    let result;
    switch (job?.jobName) {
      case 'generateReport':
        // Generate report logic
        result = await generateReport(job.data);
        break;
      case 'exportData':
        // Export data logic
        result = await exportData(job.data);
        break;
      default:
        throw new Error(`Unknown job type: ${job?.jobName}`);
    }

    // Update job as completed
    await jobRef.update({
      status: 'completed',
      result,
      completedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, result };
  } catch (error: any) {
    // Update job as failed
    await jobRef.update({
      status: 'failed',
      error: error.message,
      failedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Helper functions
async function generateReport(data: any) {
  // Implement report generation logic
  return { reportId: 'report_' + Date.now() };
}

async function exportData(data: any) {
  // Implement data export logic
  return { exportId: 'export_' + Date.now() };
}