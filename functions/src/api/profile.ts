import { Router } from 'express';
import * as admin from 'firebase-admin';

export const profileRoutes = Router();

profileRoutes.get('/', async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(decodedToken.uid)
      .get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(userDoc.data());
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});