/**
 * Firebase Functions Provider
 * Implements IFunctionsProvider interface for Cloud Functions
 */

import {
  IFunctionsProvider,
  IHttpHandler,
  IDbChangeHandler,
  IStorageChangeHandler,
  IAuthChangeHandler,
  IJobOptions,
  IJobStatus,
  IUnsubscribe
} from '../interfaces';

import { FirebaseApp } from 'firebase/app';
import {
  Functions,
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator,
  HttpsCallableResult
} from 'firebase/functions';

import {
  getFirestore,
  onSnapshot,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

export class FirebaseFunctionsProvider implements IFunctionsProvider {
  private functions: Functions;
  private db: any;
  private httpEndpoints: Map<string, IHttpHandler> = new Map();
  private scheduledFunctions: Map<string, any> = new Map();
  private activeJobs: Map<string, IJobStatus> = new Map();

  constructor(app: FirebaseApp) {
    this.functions = getFunctions(app);
    this.db = getFirestore(app);

    // Connect to emulator in development
    if (process.env.NODE_ENV === 'development' && process.env.USE_FIREBASE_EMULATORS === 'true') {
      connectFunctionsEmulator(this.functions, 'localhost', 5001);
    }
  }

  /**
   * Invoke a Cloud Function
   */
  async invoke<T, R>(functionName: string, data: T): Promise<R> {
    try {
      const callable = httpsCallable<T, R>(this.functions, functionName);
      const result: HttpsCallableResult<R> = await callable(data);
      return result.data;
    } catch (error: any) {
      throw new Error(`Failed to invoke function ${functionName}: ${error.message}`);
    }
  }

  /**
   * Invoke a function asynchronously (returns job ID)
   */
  async invokeAsync<T>(functionName: string, data: T): Promise<string> {
    try {
      // Create a job entry
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const jobData: IJobStatus = {
        id: jobId,
        status: 'pending',
        createdAt: new Date()
      };

      // Store job in Firestore
      await setDoc(doc(this.db, 'jobs', jobId), {
        ...jobData,
        functionName,
        data,
        createdAt: serverTimestamp()
      });

      // Track locally
      this.activeJobs.set(jobId, jobData);

      // Invoke the async function with job ID
      const callable = httpsCallable(this.functions, `${functionName}Async`);
      callable({ ...data, jobId }).catch(error => {
        // Update job status on error
        this.updateJobStatus(jobId, 'failed', error.message);
      });

      return jobId;
    } catch (error: any) {
      throw new Error(`Failed to invoke async function ${functionName}: ${error.message}`);
    }
  }

  /**
   * Create an HTTP endpoint
   * Note: In Firebase, HTTP endpoints are defined in the functions code
   * This method is for local tracking/management
   */
  async createHttpEndpoint(path: string, handler: IHttpHandler): Promise<void> {
    // Store handler for local reference
    this.httpEndpoints.set(path, handler);

    // In production, you would deploy this as a Firebase Function
    // firebase deploy --only functions:httpEndpoint

    console.log(`HTTP endpoint registered: ${path}`);
    console.log('Deploy with: firebase deploy --only functions');
  }

  /**
   * Remove an HTTP endpoint
   */
  async removeHttpEndpoint(path: string): Promise<void> {
    this.httpEndpoints.delete(path);

    // In production, you would remove this from Firebase Functions
    console.log(`HTTP endpoint removed: ${path}`);
  }

  /**
   * Schedule a function to run on a cron schedule
   */
  async schedule(name: string, cron: string, handler: () => Promise<void>): Promise<void> {
    // Store scheduled function
    this.scheduledFunctions.set(name, {
      cron,
      handler
    });

    // In Firebase, scheduled functions are defined in the functions code
    // Example:
    // exports.scheduledFunction = functions.pubsub.schedule(cron).onRun(handler);

    console.log(`Scheduled function registered: ${name} with cron: ${cron}`);
    console.log('Deploy with: firebase deploy --only functions');
  }

  /**
   * Remove a scheduled function
   */
  async unschedule(name: string): Promise<void> {
    this.scheduledFunctions.delete(name);

    console.log(`Scheduled function removed: ${name}`);
  }

  /**
   * Listen for database changes
   */
  onDatabaseChange(collectionName: string, handler: IDbChangeHandler): IUnsubscribe {
    const collectionRef = collection(this.db, collectionName);

    // Create a snapshot listener
    const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const changeData = {
          type: change.type as 'create' | 'update' | 'delete',
          before: change.type === 'removed' ? change.doc.data() : undefined,
          after: change.type !== 'removed' ? change.doc.data() : undefined
        };

        // Call the handler
        try {
          await handler(changeData);
        } catch (error) {
          console.error('Database change handler error:', error);
        }
      });
    });

    return unsubscribe;
  }

  /**
   * Listen for storage changes
   * Note: Firebase Storage doesn't have direct triggers in the client SDK
   * This would be implemented as a Cloud Function
   */
  onStorageChange(bucket: string, handler: IStorageChangeHandler): IUnsubscribe {
    // In Firebase, storage triggers are defined in Cloud Functions
    // Example:
    // exports.onFileUpload = functions.storage.object().onFinalize(handler);

    console.log(`Storage trigger registered for bucket: ${bucket}`);
    console.log('Implement in Cloud Functions with functions.storage.object()');

    // Return a mock unsubscribe function
    return () => {
      console.log(`Storage trigger unregistered for bucket: ${bucket}`);
    };
  }

  /**
   * Listen for authentication changes
   */
  onAuthChange(handler: IAuthChangeHandler): IUnsubscribe {
    // In Firebase, auth triggers are defined in Cloud Functions
    // Example:
    // exports.onUserCreate = functions.auth.user().onCreate(handler);

    console.log('Auth trigger registered');
    console.log('Implement in Cloud Functions with functions.auth.user()');

    // Return a mock unsubscribe function
    return () => {
      console.log('Auth trigger unregistered');
    };
  }

  /**
   * Enqueue a background job
   */
  async enqueueJob<T>(jobName: string, data: T, options?: IJobOptions): Promise<string> {
    try {
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const jobData: IJobStatus = {
        id: jobId,
        status: 'pending',
        createdAt: new Date()
      };

      // Store job in Firestore
      const jobDoc = {
        ...jobData,
        jobName,
        data,
        options,
        createdAt: serverTimestamp(),
        scheduledFor: options?.delay
          ? new Date(Date.now() + options.delay)
          : serverTimestamp(),
        priority: options?.priority || 0,
        retries: 0,
        maxRetries: options?.retries || 3,
        timeout: options?.timeout || 60000
      };

      await setDoc(doc(this.db, 'jobs', jobId), jobDoc);

      // Track locally
      this.activeJobs.set(jobId, jobData);

      // Trigger the job processor function
      const processJob = httpsCallable(this.functions, 'processJob');
      processJob({ jobId }).catch(error => {
        this.updateJobStatus(jobId, 'failed', error.message);
      });

      return jobId;
    } catch (error: any) {
      throw new Error(`Failed to enqueue job ${jobName}: ${error.message}`);
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<IJobStatus> {
    try {
      // Check local cache first
      if (this.activeJobs.has(jobId)) {
        const localStatus = this.activeJobs.get(jobId)!;

        // If job is completed or failed, return cached status
        if (localStatus.status === 'completed' || localStatus.status === 'failed') {
          return localStatus;
        }
      }

      // Fetch from Firestore
      const jobDoc = await getDoc(doc(this.db, 'jobs', jobId));

      if (!jobDoc.exists()) {
        throw new Error(`Job ${jobId} not found`);
      }

      const jobData = jobDoc.data();

      const status: IJobStatus = {
        id: jobId,
        status: jobData.status,
        progress: jobData.progress,
        result: jobData.result,
        error: jobData.error,
        createdAt: jobData.createdAt?.toDate() || new Date(),
        startedAt: jobData.startedAt?.toDate(),
        completedAt: jobData.completedAt?.toDate()
      };

      // Update local cache
      this.activeJobs.set(jobId, status);

      return status;
    } catch (error: any) {
      throw new Error(`Failed to get job status: ${error.message}`);
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<void> {
    try {
      // Update job status in Firestore
      await updateDoc(doc(this.db, 'jobs', jobId), {
        status: 'cancelled',
        cancelledAt: serverTimestamp()
      });

      // Update local cache
      if (this.activeJobs.has(jobId)) {
        const job = this.activeJobs.get(jobId)!;
        job.status = 'cancelled';
      }

      // Call cancel function
      const cancelJobFunction = httpsCallable(this.functions, 'cancelJob');
      await cancelJobFunction({ jobId });
    } catch (error: any) {
      throw new Error(`Failed to cancel job ${jobId}: ${error.message}`);
    }
  }

  // Helper methods

  /**
   * Update job status
   */
  private async updateJobStatus(jobId: string, status: IJobStatus['status'], error?: string): Promise<void> {
    try {
      const updates: any = {
        status,
        updatedAt: serverTimestamp()
      };

      if (status === 'running') {
        updates.startedAt = serverTimestamp();
      } else if (status === 'completed') {
        updates.completedAt = serverTimestamp();
      } else if (status === 'failed') {
        updates.error = error;
        updates.failedAt = serverTimestamp();
      }

      await updateDoc(doc(this.db, 'jobs', jobId), updates);

      // Update local cache
      if (this.activeJobs.has(jobId)) {
        const job = this.activeJobs.get(jobId)!;
        job.status = status;
        if (error) job.error = error;
      }
    } catch (err) {
      console.error(`Failed to update job status for ${jobId}:`, err);
    }
  }

  /**
   * Clean up completed jobs
   */
  async cleanupJobs(olderThan: Date): Promise<number> {
    try {
      let cleanedCount = 0;

      // Clean local cache
      for (const [jobId, job] of this.activeJobs.entries()) {
        if (
          (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') &&
          job.createdAt < olderThan
        ) {
          this.activeJobs.delete(jobId);
          cleanedCount++;
        }
      }

      // In production, you would also clean up Firestore
      // This would typically be done by a scheduled Cloud Function

      return cleanedCount;
    } catch (error: any) {
      throw new Error(`Failed to cleanup jobs: ${error.message}`);
    }
  }

  /**
   * Get all active jobs
   */
  getActiveJobs(): IJobStatus[] {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Monitor job progress
   */
  monitorJob(jobId: string, callback: (status: IJobStatus) => void): IUnsubscribe {
    const jobRef = doc(this.db, 'jobs', jobId);

    const unsubscribe = onSnapshot(jobRef, (snapshot) => {
      if (snapshot.exists()) {
        const jobData = snapshot.data();

        const status: IJobStatus = {
          id: jobId,
          status: jobData.status,
          progress: jobData.progress,
          result: jobData.result,
          error: jobData.error,
          createdAt: jobData.createdAt?.toDate() || new Date(),
          startedAt: jobData.startedAt?.toDate(),
          completedAt: jobData.completedAt?.toDate()
        };

        // Update local cache
        this.activeJobs.set(jobId, status);

        // Call callback
        callback(status);
      }
    });

    return unsubscribe;
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<string> {
    try {
      const jobStatus = await this.getJobStatus(jobId);

      if (jobStatus.status !== 'failed') {
        throw new Error('Can only retry failed jobs');
      }

      // Get original job data
      const jobDoc = await getDoc(doc(this.db, 'jobs', jobId));
      const jobData = jobDoc.data();

      // Create a new job with the same data
      return await this.enqueueJob(jobData?.jobName || 'retry', jobData?.data, {
        ...jobData?.options,
        retries: (jobData?.options?.retries || 3) - 1
      });
    } catch (error: any) {
      throw new Error(`Failed to retry job ${jobId}: ${error.message}`);
    }
  }
}