/**
 * Authentication API Routes
 */

import { Router } from 'express';
import * as admin from 'firebase-admin';

export const authRoutes = Router();

// Login endpoint
authRoutes.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Note: Firebase Admin SDK doesn't support password verification
    // This should be done on the client side with Firebase Auth SDK
    // This endpoint is for additional server-side logic after client auth

    res.json({
      message: 'Please use Firebase Auth SDK on client side',
      redirectTo: 'https://studio.yarlis.com'
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

// Register endpoint
authRoutes.post('/register', async (req, res) => {
  const { email, password, displayName } = req.body;

  try {
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
      emailVerified: false
    });

    // Create user profile in Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      subscription: {
        plan: 'free',
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    res.status(201).json({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Verify token endpoint
authRoutes.post('/verify', async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);

    res.json({
      valid: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
      claims: decodedToken
    });
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout endpoint
authRoutes.post('/logout', async (req, res) => {
  // Firebase handles logout on client side
  // This endpoint can be used for server-side cleanup

  res.json({ success: true });
});

// Get user profile
authRoutes.get('/profile', async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Get user profile from Firestore
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(decodedToken.uid)
      .get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(userDoc.data());
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid token' });
  }
});