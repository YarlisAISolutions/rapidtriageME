"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processJob = exports.createCustomToken = exports.verifyToken = exports.aggregateAnalytics = exports.dailyCleanup = exports.onScreenshotUpload = exports.onProjectCreate = exports.onUserDelete = exports.onUserCreate = exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
admin.initializeApp();
const app = (0, express_1.default)();
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
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
const auth_1 = require("./api/auth");
const screenshot_1 = require("./api/screenshot");
const browser_1 = require("./api/browser");
const mcp_1 = require("./api/mcp");
const profile_1 = require("./api/profile");
app.use('/api/auth', auth_1.authRoutes);
app.use('/api/screenshot', screenshot_1.screenshotRoutes);
app.use('/api/browser', browser_1.browserRoutes);
app.use('/api/mcp', mcp_1.mcpRoutes);
app.use('/api/profile', profile_1.profileRoutes);
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'RapidTriageME Firebase Functions',
        version: '1.0.0'
    });
});
exports.api = functions.https.onRequest(app);
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
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
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        role: 'user',
        emailVerified: user.emailVerified
    });
    console.log('New user created:', user.email);
});
exports.onUserDelete = functions.auth.user().onDelete(async (user) => {
    const db = admin.firestore();
    await db.collection('users').doc(user.uid).delete();
    const apiKeys = await db.collection('apiKeys')
        .where('userId', '==', user.uid)
        .get();
    const batch = db.batch();
    apiKeys.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log('User deleted:', user.email);
});
exports.onProjectCreate = functions.firestore
    .document('projects/{projectId}')
    .onCreate(async (snap, context) => {
    const project = snap.data();
    const projectId = context.params.projectId;
    const db = admin.firestore();
    await db.collection('projects').doc(projectId)
        .collection('sessions').add({
        name: 'Default Session',
        status: 'inactive',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Project created:', projectId);
});
exports.onScreenshotUpload = functions.storage
    .object()
    .onFinalize(async (object) => {
    const filePath = object.name;
    const contentType = object.contentType;
    if (!filePath?.startsWith('screenshots/') || !contentType?.startsWith('image/')) {
        return;
    }
    const pathParts = filePath.split('/');
    const userId = pathParts[1];
    const projectId = pathParts[2];
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
exports.dailyCleanup = functions.pubsub
    .schedule('0 2 * * *')
    .timeZone('America/New_York')
    .onRun(async (context) => {
    const db = admin.firestore();
    const storage = admin.storage();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const oldSessions = await db.collection('sessions')
        .where('createdAt', '<', sevenDaysAgo)
        .where('status', '==', 'inactive')
        .get();
    const batch = db.batch();
    oldSessions.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
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
exports.aggregateAnalytics = functions.pubsub
    .schedule('0 * * * *')
    .onRun(async (context) => {
    const db = admin.firestore();
    const hour = new Date();
    hour.setMinutes(0, 0, 0);
    const metrics = await db.collection('metrics')
        .where('timestamp', '>=', hour)
        .get();
    const aggregated = {};
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
exports.verifyToken = functions.https.onCall(async (data, context) => {
    const { token } = data;
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        return {
            valid: true,
            uid: decodedToken.uid,
            email: decodedToken.email,
            claims: decodedToken
        };
    }
    catch (error) {
        return {
            valid: false,
            error: 'Invalid token'
        };
    }
});
exports.createCustomToken = functions.https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.token.admin) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can create custom tokens');
    }
    const { userId, claims } = data;
    try {
        const customToken = await admin.auth().createCustomToken(userId, claims);
        return { token: customToken };
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});
exports.processJob = functions.https.onCall(async (data, context) => {
    const { jobId } = data;
    const db = admin.firestore();
    const jobRef = db.collection('jobs').doc(jobId);
    const jobDoc = await jobRef.get();
    if (!jobDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Job not found');
    }
    const job = jobDoc.data();
    await jobRef.update({
        status: 'running',
        startedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    try {
        let result;
        switch (job?.jobName) {
            case 'generateReport':
                result = await generateReport(job.data);
                break;
            case 'exportData':
                result = await exportData(job.data);
                break;
            default:
                throw new Error(`Unknown job type: ${job?.jobName}`);
        }
        await jobRef.update({
            status: 'completed',
            result,
            completedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, result };
    }
    catch (error) {
        await jobRef.update({
            status: 'failed',
            error: error.message,
            failedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        throw new functions.https.HttpsError('internal', error.message);
    }
});
async function generateReport(data) {
    return { reportId: 'report_' + Date.now() };
}
async function exportData(data) {
    return { exportId: 'export_' + Date.now() };
}
//# sourceMappingURL=index.js.map