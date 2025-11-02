import { Router } from 'express';
import * as admin from 'firebase-admin';

export const screenshotRoutes = Router();

screenshotRoutes.post('/capture', async (req, res) => {
  const { url, projectId } = req.body;

  // Store screenshot metadata
  const db = admin.firestore();
  const screenshot = await db.collection('screenshots').add({
    url,
    projectId,
    capturedAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'pending'
  });

  res.json({ id: screenshot.id, status: 'processing' });
});