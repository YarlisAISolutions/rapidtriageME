#!/usr/bin/env node

/**
 * Firebase Setup Validation Script
 *
 * Validates Firebase configuration and emulator connectivity for RapidTriageME.
 *
 * Usage:
 *   node test-firebase-setup.js
 *   node test-firebase-setup.js --emulator   # Also test emulator connectivity
 *
 * Exit codes:
 *   0 - All validations passed
 *   1 - Validation failed
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// ============================================
// CONFIGURATION
// ============================================

const PROJECT_ROOT = __dirname;
const FIREBASE_PROJECT_ID = 'rapidtriage-me';

const CONFIG_FILES = {
  firebase: path.join(PROJECT_ROOT, 'firebase.json'),
  firebaserc: path.join(PROJECT_ROOT, '.firebaserc'),
  firestoreRules: path.join(PROJECT_ROOT, 'firestore.rules'),
  storageRules: path.join(PROJECT_ROOT, 'storage.rules'),
  firestoreIndexes: path.join(PROJECT_ROOT, 'firestore.indexes.json'),
  env: path.join(PROJECT_ROOT, '.env'),
  functionsPackage: path.join(PROJECT_ROOT, 'functions', 'package.json'),
};

const EMULATOR_PORTS = {
  auth: 9099,
  firestore: 8080,
  storage: 9199,
  functions: 5001,
  hosting: 5000,
  ui: 4000,
};

// ============================================
// UTILITIES
// ============================================

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`[PASS] ${message}`, colors.green);
}

function fail(message) {
  log(`[FAIL] ${message}`, colors.red);
}

function warn(message) {
  log(`[WARN] ${message}`, colors.yellow);
}

function info(message) {
  log(`[INFO] ${message}`, colors.cyan);
}

function header(message) {
  console.log();
  log(`=== ${message} ===`, colors.blue);
  console.log();
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Check if Firebase CLI is installed
 */
function checkFirebaseCLI() {
  try {
    const version = execSync('firebase --version', { encoding: 'utf-8' }).trim();
    success(`Firebase CLI installed: ${version}`);
    return true;
  } catch (error) {
    fail('Firebase CLI not installed. Install with: npm install -g firebase-tools');
    return false;
  }
}

/**
 * Check if file exists
 */
function checkFileExists(name, filePath) {
  if (fs.existsSync(filePath)) {
    success(`${name} exists: ${path.relative(PROJECT_ROOT, filePath)}`);
    return true;
  } else {
    fail(`${name} not found: ${path.relative(PROJECT_ROOT, filePath)}`);
    return false;
  }
}

/**
 * Validate JSON file syntax
 */
function validateJsonFile(name, filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    JSON.parse(content);
    success(`${name} has valid JSON syntax`);
    return true;
  } catch (error) {
    fail(`${name} has invalid JSON: ${error.message}`);
    return false;
  }
}

/**
 * Validate firebase.json configuration
 */
function validateFirebaseJson() {
  const filePath = CONFIG_FILES.firebase;
  if (!validateJsonFile('firebase.json', filePath)) {
    return false;
  }

  try {
    const config = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    let valid = true;

    // Check hosting configuration
    if (!config.hosting) {
      fail('firebase.json missing hosting configuration');
      valid = false;
    } else {
      success('firebase.json has hosting configuration');
    }

    // Check functions configuration
    if (!config.functions) {
      fail('firebase.json missing functions configuration');
      valid = false;
    } else {
      const funcConfig = Array.isArray(config.functions) ? config.functions[0] : config.functions;
      if (funcConfig.runtime !== 'nodejs20') {
        warn(`firebase.json functions runtime is ${funcConfig.runtime}, expected nodejs20`);
      } else {
        success('firebase.json functions runtime is nodejs20');
      }
    }

    // Check firestore configuration
    if (!config.firestore) {
      fail('firebase.json missing firestore configuration');
      valid = false;
    } else {
      success('firebase.json has firestore configuration');
    }

    // Check storage configuration
    if (!config.storage) {
      fail('firebase.json missing storage configuration');
      valid = false;
    } else {
      success('firebase.json has storage configuration');
    }

    // Check emulators configuration
    if (!config.emulators) {
      warn('firebase.json missing emulators configuration');
    } else {
      const requiredEmulators = ['auth', 'functions', 'firestore', 'hosting', 'storage'];
      const missingEmulators = requiredEmulators.filter(e => !config.emulators[e]);
      if (missingEmulators.length > 0) {
        warn(`firebase.json missing emulators: ${missingEmulators.join(', ')}`);
      } else {
        success('firebase.json has all required emulator configurations');
      }
    }

    return valid;
  } catch (error) {
    fail(`Error parsing firebase.json: ${error.message}`);
    return false;
  }
}

/**
 * Validate .firebaserc project configuration
 */
function validateFirebaserc() {
  const filePath = CONFIG_FILES.firebaserc;
  if (!validateJsonFile('.firebaserc', filePath)) {
    return false;
  }

  try {
    const config = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (!config.projects) {
      fail('.firebaserc missing projects configuration');
      return false;
    }

    if (config.projects.default !== FIREBASE_PROJECT_ID) {
      warn(`.firebaserc default project is ${config.projects.default}, expected ${FIREBASE_PROJECT_ID}`);
    } else {
      success(`.firebaserc default project is ${FIREBASE_PROJECT_ID}`);
    }

    return true;
  } catch (error) {
    fail(`Error parsing .firebaserc: ${error.message}`);
    return false;
  }
}

/**
 * Validate Firestore rules syntax
 */
function validateFirestoreRules() {
  const filePath = CONFIG_FILES.firestoreRules;
  if (!checkFileExists('firestore.rules', filePath)) {
    return false;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Basic syntax checks
    if (!content.includes('rules_version')) {
      fail('firestore.rules missing rules_version declaration');
      return false;
    }

    if (!content.includes('service cloud.firestore')) {
      fail('firestore.rules missing service declaration');
      return false;
    }

    if (!content.includes('match /databases/{database}/documents')) {
      fail('firestore.rules missing database match statement');
      return false;
    }

    // Check for balanced braces
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      fail(`firestore.rules has unbalanced braces: ${openBraces} open, ${closeBraces} close`);
      return false;
    }

    success('firestore.rules has valid syntax');
    return true;
  } catch (error) {
    fail(`Error reading firestore.rules: ${error.message}`);
    return false;
  }
}

/**
 * Validate Storage rules syntax
 */
function validateStorageRules() {
  const filePath = CONFIG_FILES.storageRules;
  if (!checkFileExists('storage.rules', filePath)) {
    return false;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Basic syntax checks
    if (!content.includes('rules_version')) {
      fail('storage.rules missing rules_version declaration');
      return false;
    }

    if (!content.includes('service firebase.storage')) {
      fail('storage.rules missing service declaration');
      return false;
    }

    // Check for balanced braces
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      fail(`storage.rules has unbalanced braces: ${openBraces} open, ${closeBraces} close`);
      return false;
    }

    success('storage.rules has valid syntax');
    return true;
  } catch (error) {
    fail(`Error reading storage.rules: ${error.message}`);
    return false;
  }
}

/**
 * Validate Firestore indexes
 */
function validateFirestoreIndexes() {
  const filePath = CONFIG_FILES.firestoreIndexes;
  if (!validateJsonFile('firestore.indexes.json', filePath)) {
    return false;
  }

  try {
    const config = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (!Array.isArray(config.indexes)) {
      fail('firestore.indexes.json missing indexes array');
      return false;
    }

    // Validate each index
    let valid = true;
    for (let i = 0; i < config.indexes.length; i++) {
      const index = config.indexes[i];
      if (!index.collectionGroup) {
        fail(`Index ${i} missing collectionGroup`);
        valid = false;
      }
      if (!index.fields || !Array.isArray(index.fields)) {
        fail(`Index ${i} missing fields array`);
        valid = false;
      }
    }

    if (valid) {
      success(`firestore.indexes.json has ${config.indexes.length} valid indexes`);
    }

    return valid;
  } catch (error) {
    fail(`Error parsing firestore.indexes.json: ${error.message}`);
    return false;
  }
}

/**
 * Validate environment configuration
 */
function validateEnvironment() {
  const filePath = CONFIG_FILES.env;
  if (!checkFileExists('.env', filePath)) {
    return false;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const envVars = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key] = trimmed.split('=');
        if (key) {
          envVars[key.trim()] = true;
        }
      }
    }

    // Required Firebase variables
    const requiredVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_API_KEY',
      'FIREBASE_AUTH_DOMAIN',
      'FIREBASE_STORAGE_BUCKET',
    ];

    let valid = true;
    for (const varName of requiredVars) {
      if (!envVars[varName]) {
        fail(`.env missing required variable: ${varName}`);
        valid = false;
      } else {
        success(`.env has ${varName}`);
      }
    }

    // Check that Cloudflare vars are noted as removed
    const cloudflareVars = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN', 'ZONE_ID'];
    let hasActiveCloudflare = false;
    for (const varName of cloudflareVars) {
      if (envVars[varName]) {
        warn(`.env still has Cloudflare variable: ${varName}`);
        hasActiveCloudflare = true;
      }
    }

    if (!hasActiveCloudflare) {
      success('.env has no active Cloudflare configuration');
    }

    // Check API base URL points to Firebase
    if (content.includes('API_BASE_URL=https://rapidtriage-me.web.app') ||
        content.includes('API_BASE_URL=https://rapidtriage.me')) {
      success('.env API_BASE_URL points to Firebase hosting');
    } else {
      warn('.env API_BASE_URL may not point to Firebase hosting');
    }

    return valid;
  } catch (error) {
    fail(`Error reading .env: ${error.message}`);
    return false;
  }
}

/**
 * Validate functions package.json
 */
function validateFunctionsPackage() {
  const filePath = CONFIG_FILES.functionsPackage;
  if (!validateJsonFile('functions/package.json', filePath)) {
    return false;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    let valid = true;

    // Check Node version
    if (!pkg.engines || pkg.engines.node !== '20') {
      warn(`functions/package.json engine is ${pkg.engines?.node}, expected 20`);
    } else {
      success('functions/package.json Node engine is 20');
    }

    // Check required dependencies
    const requiredDeps = ['firebase-admin', 'firebase-functions'];
    for (const dep of requiredDeps) {
      if (!pkg.dependencies || !pkg.dependencies[dep]) {
        fail(`functions/package.json missing dependency: ${dep}`);
        valid = false;
      } else {
        success(`functions/package.json has ${dep}`);
      }
    }

    // Check test script
    if (!pkg.scripts || !pkg.scripts.test) {
      warn('functions/package.json missing test script');
    } else {
      success('functions/package.json has test script');
    }

    return valid;
  } catch (error) {
    fail(`Error parsing functions/package.json: ${error.message}`);
    return false;
  }
}

/**
 * Check if emulator is running on a port
 */
async function checkPort(port, serviceName) {
  return new Promise((resolve) => {
    const net = require('net');
    const socket = new net.Socket();

    socket.setTimeout(1000);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, '127.0.0.1');
  });
}

/**
 * Test emulator connectivity
 */
async function testEmulatorConnectivity() {
  header('Emulator Connectivity');

  let anyRunning = false;

  for (const [service, port] of Object.entries(EMULATOR_PORTS)) {
    const running = await checkPort(port, service);
    if (running) {
      success(`${service} emulator running on port ${port}`);
      anyRunning = true;
    } else {
      info(`${service} emulator not running on port ${port}`);
    }
  }

  if (!anyRunning) {
    info('No emulators running. Start with: firebase emulators:start');
  }

  return anyRunning;
}

/**
 * Test HTTP endpoint if functions emulator is running
 */
async function testHealthEndpoint() {
  const http = require('http');
  const functionsPort = EMULATOR_PORTS.functions;

  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${functionsPort}/rapidtriage-me/us-central1/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          success('Health endpoint responded with 200');
          try {
            const json = JSON.parse(data);
            if (json.status) {
              success(`Health status: ${json.status}`);
            }
          } catch (e) {
            // Response may not be JSON
          }
          resolve(true);
        } else {
          warn(`Health endpoint responded with status ${res.statusCode}`);
          resolve(false);
        }
      });
    });

    req.on('error', () => {
      info('Health endpoint not available (functions emulator may not be running)');
      resolve(false);
    });

    req.setTimeout(3000, () => {
      req.destroy();
      info('Health endpoint request timed out');
      resolve(false);
    });
  });
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const testEmulator = args.includes('--emulator');

  console.log();
  log('Firebase Setup Validation for RapidTriageME', colors.cyan);
  log(`Project: ${FIREBASE_PROJECT_ID}`, colors.cyan);
  console.log();

  let allPassed = true;

  // Check Firebase CLI
  header('Firebase CLI');
  if (!checkFirebaseCLI()) {
    allPassed = false;
  }

  // Check configuration files exist
  header('Configuration Files');
  for (const [name, filePath] of Object.entries(CONFIG_FILES)) {
    if (!checkFileExists(name, filePath)) {
      allPassed = false;
    }
  }

  // Validate firebase.json
  header('Firebase Configuration (firebase.json)');
  if (!validateFirebaseJson()) {
    allPassed = false;
  }

  // Validate .firebaserc
  header('Project Configuration (.firebaserc)');
  if (!validateFirebaserc()) {
    allPassed = false;
  }

  // Validate Firestore rules
  header('Firestore Rules');
  if (!validateFirestoreRules()) {
    allPassed = false;
  }

  // Validate Storage rules
  header('Storage Rules');
  if (!validateStorageRules()) {
    allPassed = false;
  }

  // Validate Firestore indexes
  header('Firestore Indexes');
  if (!validateFirestoreIndexes()) {
    allPassed = false;
  }

  // Validate environment
  header('Environment Configuration');
  if (!validateEnvironment()) {
    allPassed = false;
  }

  // Validate functions package
  header('Functions Package');
  if (!validateFunctionsPackage()) {
    allPassed = false;
  }

  // Test emulator connectivity if requested
  if (testEmulator) {
    const emulatorsRunning = await testEmulatorConnectivity();

    if (emulatorsRunning) {
      header('Health Endpoint Test');
      await testHealthEndpoint();
    }
  }

  // Summary
  header('Summary');
  if (allPassed) {
    success('All Firebase configuration validations passed!');
    console.log();
    info('Next steps:');
    info('  1. Install functions dependencies: cd functions && npm install');
    info('  2. Build functions: cd functions && npm run build');
    info('  3. Start emulators: firebase emulators:start');
    info('  4. Run tests: cd functions && npm test');
    console.log();
    process.exit(0);
  } else {
    fail('Some validations failed. Please review the errors above.');
    process.exit(1);
  }
}

main().catch((error) => {
  fail(`Unexpected error: ${error.message}`);
  process.exit(1);
});
