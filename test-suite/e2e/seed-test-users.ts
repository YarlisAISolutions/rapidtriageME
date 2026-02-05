/**
 * Seed Test Users Script
 *
 * Seeds test users with different subscription tiers into Firebase
 * for comprehensive E2E testing.
 *
 * Usage: npx tsx seed-test-users.ts [--emulator]
 */

import { TEST_USERS, TestUser, userToFirestoreDocs } from './test-users';

// Check if running against emulator
const useEmulator = process.argv.includes('--emulator');

// Firebase Admin initialization
let admin: any;
let db: any;

async function initializeFirebase(): Promise<void> {
  // Dynamic import to avoid issues when Firebase isn't available
  const firebaseAdmin = await import('firebase-admin');
  admin = firebaseAdmin.default;

  if (useEmulator) {
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
    console.log('🔧 Using Firebase Emulators');
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: 'rapidtriage-me',
    });
  }

  db = admin.firestore();
}

async function seedUser(user: TestUser): Promise<void> {
  const docs = userToFirestoreDocs(user);

  console.log(`  Seeding user: ${user.displayName} (${user.tier})`);

  // Create user document
  await db.collection('users').doc(user.id).set({
    ...docs.userDoc,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Create subscription document
  await db.collection('subscriptions').doc(user.id).set({
    ...docs.subscriptionDoc,
    currentPeriodStart: admin.firestore.Timestamp.fromDate(docs.subscriptionDoc.currentPeriodStart),
    currentPeriodEnd: admin.firestore.Timestamp.fromDate(docs.subscriptionDoc.currentPeriodEnd),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Create usage document
  const now = new Date();
  const usageDocId = `${user.id}_${now.getFullYear()}_${now.getMonth() + 1}`;
  await db.collection('usage').doc(usageDocId).set({
    ...docs.usageDoc,
    lastScanAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // If user has API key enabled, create a test API key
  if (user.apiKeyEnabled) {
    const apiKeyId = `api-key-${user.id}`;
    await db.collection('apiKeys').doc(apiKeyId).set({
      keyId: apiKeyId,
      userId: user.id,
      name: `Test API Key - ${user.displayName}`,
      keyHash: 'test-hash-' + user.id, // In production, this would be hashed
      permissions: user.permissions,
      isActive: true,
      lastUsed: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create lookup entry
    await db.collection('apiKeyLookup').doc(`test-key-${user.id}`).set({
      keyId: apiKeyId,
      userId: user.id,
    });
  }
}

async function clearTestUsers(): Promise<void> {
  console.log('\n🗑️  Clearing existing test users...');

  const batch = db.batch();
  const testUserIds = Object.values(TEST_USERS).map((u) => u.id);

  for (const userId of testUserIds) {
    batch.delete(db.collection('users').doc(userId));
    batch.delete(db.collection('subscriptions').doc(userId));

    // Clear usage docs for current month
    const now = new Date();
    const usageDocId = `${userId}_${now.getFullYear()}_${now.getMonth() + 1}`;
    batch.delete(db.collection('usage').doc(usageDocId));

    // Clear API keys
    batch.delete(db.collection('apiKeys').doc(`api-key-${userId}`));
    batch.delete(db.collection('apiKeyLookup').doc(`test-key-${userId}`));
  }

  await batch.commit();
  console.log('  ✓ Test users cleared');
}

async function seedAllUsers(): Promise<void> {
  console.log('\n📦 Seeding test users...\n');

  for (const user of Object.values(TEST_USERS)) {
    await seedUser(user);
  }

  console.log('\n✅ All test users seeded successfully!\n');
}

async function verifyUsers(): Promise<void> {
  console.log('🔍 Verifying seeded users...\n');

  for (const user of Object.values(TEST_USERS)) {
    const userDoc = await db.collection('users').doc(user.id).get();
    const subDoc = await db.collection('subscriptions').doc(user.id).get();

    const status = userDoc.exists && subDoc.exists ? '✓' : '✗';
    console.log(`  ${status} ${user.displayName} (${user.tier})`);
  }

  console.log('');
}

async function main(): Promise<void> {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║       RapidTriageME Test User Seeding                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  try {
    await initializeFirebase();
    await clearTestUsers();
    await seedAllUsers();
    await verifyUsers();

    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                  SEEDED TEST USERS                           ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');

    for (const [key, user] of Object.entries(TEST_USERS)) {
      const line = `║  ${user.tier.toUpperCase().padEnd(10)} │ ${user.email.padEnd(35)}`;
      console.log(line.padEnd(64) + '║');
    }

    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Failed to seed test users:', error.message);
    process.exit(1);
  }
}

main();
