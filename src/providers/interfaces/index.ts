/**
 * Provider-Agnostic Interfaces for RapidTriageME
 * Enables seamless switching between cloud providers
 */

// Main provider interface that combines all services
export interface IProvider {
  name: string;
  auth: IAuthProvider;
  database: IDatabaseProvider;
  storage: IStorageProvider;
  realtime: IRealtimeProvider;
  functions: IFunctionsProvider;
  analytics: IAnalyticsProvider;
  messaging: IMessagingProvider;
  config: IConfigProvider;
}

// Authentication Provider Interface
export interface IAuthProvider {
  // User Management
  register(email: string, password: string, metadata?: any): Promise<IUser>;
  login(email: string, password: string): Promise<IAuthResult>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<IUser | null>;
  updateUser(userId: string, updates: Partial<IUser>): Promise<void>;
  deleteUser(userId: string): Promise<void>;

  // Token Management
  verifyToken(token: string): Promise<ITokenPayload | null>;
  refreshToken(refreshToken: string): Promise<IAuthResult>;
  createCustomToken(userId: string, claims?: any): Promise<string>;

  // API Key Management
  createApiKey(userId: string, name: string, permissions: string[]): Promise<IApiKey>;
  listApiKeys(userId: string): Promise<IApiKey[]>;
  revokeApiKey(keyId: string): Promise<void>;
  validateApiKey(key: string): Promise<IApiKeyValidation | null>;

  // SSO & OAuth
  signInWithProvider(provider: 'google' | 'github' | 'microsoft' | 'keycloak'): Promise<IAuthResult>;
  linkProvider(userId: string, provider: string): Promise<void>;
  unlinkProvider(userId: string, provider: string): Promise<void>;

  // MFA
  enableMFA(userId: string, method: 'totp' | 'sms' | 'email'): Promise<IMFASetup>;
  verifyMFA(userId: string, code: string): Promise<boolean>;
  disableMFA(userId: string): Promise<void>;

  // Password Management
  resetPassword(email: string): Promise<void>;
  updatePassword(userId: string, oldPassword: string, newPassword: string): Promise<void>;

  // Email Verification
  sendVerificationEmail(userId: string): Promise<void>;
  verifyEmail(token: string): Promise<void>;
}

// Database Provider Interface
export interface IDatabaseProvider {
  // CRUD Operations
  create<T>(collection: string, data: T): Promise<string>;
  read<T>(collection: string, id: string): Promise<T | null>;
  update<T>(collection: string, id: string, data: Partial<T>): Promise<void>;
  delete(collection: string, id: string): Promise<void>;

  // Batch Operations
  batchCreate<T>(collection: string, items: T[]): Promise<string[]>;
  batchUpdate<T>(collection: string, updates: { id: string; data: Partial<T> }[]): Promise<void>;
  batchDelete(collection: string, ids: string[]): Promise<void>;

  // Query Operations
  query<T>(collection: string, options: IQueryOptions): Promise<IQueryResult<T>>;
  aggregate<T>(collection: string, pipeline: IAggregationPipeline): Promise<T[]>;

  // Transactions
  transaction<T>(operations: ITransactionOperation[]): Promise<T>;

  // Real-time Listeners
  subscribe<T>(collection: string, id: string, callback: (data: T) => void): IUnsubscribe;
  subscribeToQuery<T>(collection: string, query: IQueryOptions, callback: (data: T[]) => void): IUnsubscribe;

  // Indexes
  createIndex(collection: string, index: IIndexDefinition): Promise<void>;
  dropIndex(collection: string, indexName: string): Promise<void>;
}

// Storage Provider Interface
export interface IStorageProvider {
  // File Operations
  upload(path: string, file: File | Buffer | Blob, metadata?: IFileMetadata): Promise<IUploadResult>;
  download(path: string): Promise<Blob>;
  delete(path: string): Promise<void>;
  move(sourcePath: string, destinationPath: string): Promise<void>;
  copy(sourcePath: string, destinationPath: string): Promise<void>;

  // URL Management
  getSignedUrl(path: string, expires?: number): Promise<string>;
  getPublicUrl(path: string): string;

  // Directory Operations
  listFiles(prefix: string, options?: IListOptions): Promise<IFileList>;
  createFolder(path: string): Promise<void>;
  deleteFolder(path: string): Promise<void>;

  // Metadata
  getMetadata(path: string): Promise<IFileMetadata>;
  updateMetadata(path: string, metadata: Partial<IFileMetadata>): Promise<void>;

  // Batch Operations
  batchUpload(files: { path: string; file: File | Buffer }[]): Promise<IUploadResult[]>;
  batchDelete(paths: string[]): Promise<void>;
}

// Real-time Provider Interface
export interface IRealtimeProvider {
  // Connection Management
  connect(options?: IConnectionOptions): Promise<void>;
  disconnect(): Promise<void>;
  getConnectionStatus(): IConnectionStatus;

  // Channel/Room Management
  createChannel(channelId: string, options?: IChannelOptions): Promise<IChannel>;
  joinChannel(channelId: string): Promise<IChannel>;
  leaveChannel(channelId: string): Promise<void>;
  deleteChannel(channelId: string): Promise<void>;

  // Messaging
  publish(channel: string, event: string, data: any): Promise<void>;
  subscribe(channel: string, event: string, callback: (data: any) => void): IUnsubscribe;
  broadcast(event: string, data: any): Promise<void>;

  // Presence
  setPresence(channel: string, status: IPresenceStatus): Promise<void>;
  getPresence(channel: string): Promise<IPresenceInfo[]>;
  subscribeToPresence(channel: string, callback: (presence: IPresenceInfo[]) => void): IUnsubscribe;

  // Direct Messaging
  sendDirectMessage(userId: string, message: any): Promise<void>;
  onDirectMessage(callback: (from: string, message: any) => void): IUnsubscribe;
}

// Functions Provider Interface
export interface IFunctionsProvider {
  // Function Invocation
  invoke<T, R>(functionName: string, data: T): Promise<R>;
  invokeAsync<T>(functionName: string, data: T): Promise<string>; // Returns invocation ID

  // HTTP Functions
  createHttpEndpoint(path: string, handler: IHttpHandler): Promise<void>;
  removeHttpEndpoint(path: string): Promise<void>;

  // Scheduled Functions
  schedule(name: string, cron: string, handler: () => Promise<void>): Promise<void>;
  unschedule(name: string): Promise<void>;

  // Event Triggers
  onDatabaseChange(collection: string, handler: IDbChangeHandler): IUnsubscribe;
  onStorageChange(bucket: string, handler: IStorageChangeHandler): IUnsubscribe;
  onAuthChange(handler: IAuthChangeHandler): IUnsubscribe;

  // Background Jobs
  enqueueJob<T>(jobName: string, data: T, options?: IJobOptions): Promise<string>;
  getJobStatus(jobId: string): Promise<IJobStatus>;
  cancelJob(jobId: string): Promise<void>;
}

// Analytics Provider Interface
export interface IAnalyticsProvider {
  // Event Tracking
  trackEvent(eventName: string, parameters?: any): Promise<void>;
  trackPageView(pageName: string, parameters?: any): Promise<void>;
  trackUserAction(action: string, category: string, label?: string, value?: number): Promise<void>;

  // User Analytics
  setUserId(userId: string): Promise<void>;
  setUserProperties(properties: Record<string, any>): Promise<void>;

  // Custom Metrics
  logCustomMetric(name: string, value: number, metadata?: any): Promise<void>;

  // Performance Monitoring
  startTrace(traceName: string): ITrace;

  // Reports
  getAnalyticsReport(options: IReportOptions): Promise<IAnalyticsReport>;
  exportAnalytics(format: 'csv' | 'json', options: IExportOptions): Promise<Blob>;
}

// Messaging Provider Interface
export interface IMessagingProvider {
  // Push Notifications
  sendNotification(userId: string, notification: INotification): Promise<void>;
  sendBulkNotifications(notifications: { userId: string; notification: INotification }[]): Promise<void>;

  // Topics
  subscribeToTopic(userId: string, topic: string): Promise<void>;
  unsubscribeFromTopic(userId: string, topic: string): Promise<void>;
  sendToTopic(topic: string, message: IMessage): Promise<void>;

  // Email
  sendEmail(to: string, template: string, data: any): Promise<void>;
  sendBulkEmails(emails: IEmailBatch[]): Promise<void>;

  // SMS
  sendSMS(phoneNumber: string, message: string): Promise<void>;
  sendBulkSMS(messages: { phone: string; message: string }[]): Promise<void>;

  // In-App Messaging
  sendInAppMessage(userId: string, message: IInAppMessage): Promise<void>;
}

// Configuration Provider Interface
export interface IConfigProvider {
  // Remote Config
  getConfig(key: string): Promise<any>;
  setConfig(key: string, value: any): Promise<void>;
  getAllConfigs(): Promise<Record<string, any>>;

  // Feature Flags
  isFeatureEnabled(feature: string, userId?: string): Promise<boolean>;
  setFeatureFlag(feature: string, enabled: boolean, userGroups?: string[]): Promise<void>;

  // Environment Variables
  getEnvVar(key: string): string | undefined;
  setEnvVar(key: string, value: string): Promise<void>;

  // A/B Testing
  getVariant(experimentId: string, userId: string): Promise<string>;
  logConversion(experimentId: string, userId: string): Promise<void>;
}

// Data Types
export interface IUser {
  id: string;
  email: string;
  name?: string;
  photoUrl?: string;
  emailVerified: boolean;
  phoneNumber?: string;
  metadata: {
    createdAt: Date;
    lastLoginAt: Date;
  };
  customClaims?: Record<string, any>;
  providers?: string[];
}

export interface IAuthResult {
  user: IUser;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ITokenPayload {
  sub: string;
  email?: string;
  emailVerified?: boolean;
  claims?: Record<string, any>;
  exp: number;
  iat: number;
}

export interface IApiKey {
  id: string;
  name: string;
  key?: string; // Only returned on creation
  prefix: string;
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  permissions: string[];
  status: 'active' | 'revoked' | 'expired';
}

export interface IApiKeyValidation {
  valid: boolean;
  userId: string;
  permissions: string[];
  rateLimit?: number;
}

export interface IMFASetup {
  secret?: string;
  qrCode?: string;
  backupCodes?: string[];
}

export interface IQueryOptions {
  where?: Array<[string, IOperator, any]>;
  orderBy?: Array<[string, 'asc' | 'desc']>;
  limit?: number;
  offset?: number;
  select?: string[];
  include?: string[];
}

export interface IQueryResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  cursor?: string;
}

export interface ITransactionOperation {
  type: 'create' | 'update' | 'delete';
  collection: string;
  id?: string;
  data?: any;
}

export interface IIndexDefinition {
  name: string;
  fields: Array<{ field: string; order?: 'asc' | 'desc' }>;
  unique?: boolean;
  sparse?: boolean;
}

export interface IFileMetadata {
  size: number;
  contentType: string;
  createdAt: Date;
  updatedAt: Date;
  customMetadata?: Record<string, string>;
  cacheControl?: string;
  contentDisposition?: string;
  contentEncoding?: string;
}

export interface IUploadResult {
  path: string;
  url: string;
  size: number;
  contentType: string;
  etag?: string;
  versionId?: string;
}

export interface IListOptions {
  maxResults?: number;
  pageToken?: string;
  delimiter?: string;
  includeMetadata?: boolean;
}

export interface IFileList {
  files: IFileInfo[];
  folders: string[];
  nextPageToken?: string;
}

export interface IFileInfo {
  path: string;
  size: number;
  contentType: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: IFileMetadata;
}

export interface IChannel {
  id: string;
  name?: string;
  members: string[];
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface IConnectionOptions {
  reconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export interface IConnectionStatus {
  connected: boolean;
  latency?: number;
  lastHeartbeat?: Date;
  reconnectAttempts?: number;
}

export interface IChannelOptions {
  private?: boolean;
  presence?: boolean;
  history?: boolean;
  maxMembers?: number;
  metadata?: Record<string, any>;
}

export interface IPresenceStatus {
  online: boolean;
  status?: string;
  lastSeen?: Date;
  metadata?: Record<string, any>;
}

export interface IPresenceInfo {
  userId: string;
  status: IPresenceStatus;
}

export interface IHttpHandler {
  (request: Request): Promise<Response>;
}

export interface IDbChangeHandler {
  (change: { before?: any; after?: any; type: 'create' | 'update' | 'delete' }): Promise<void>;
}

export interface IStorageChangeHandler {
  (change: { path: string; type: 'create' | 'delete' | 'update' }): Promise<void>;
}

export interface IAuthChangeHandler {
  (change: { userId: string; type: 'signup' | 'delete' | 'login' }): Promise<void>;
}

export interface IJobOptions {
  delay?: number;
  retries?: number;
  priority?: number;
  timeout?: number;
}

export interface IJobStatus {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  result?: any;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface ITrace {
  putAttribute(key: string, value: string | number): void;
  putMetric(name: string, value: number): void;
  incrementMetric(name: string, by?: number): void;
  stop(): void;
}

export interface IReportOptions {
  startDate: Date;
  endDate: Date;
  metrics?: string[];
  dimensions?: string[];
  filters?: Record<string, any>;
}

export interface IAnalyticsReport {
  data: any[];
  summary: Record<string, any>;
  charts?: any[];
}

export interface IExportOptions extends IReportOptions {
  includeRawData?: boolean;
  compression?: boolean;
}

export interface INotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  sound?: string;
  data?: Record<string, any>;
  clickAction?: string;
}

export interface IMessage {
  title?: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'high' | 'normal';
}

export interface IEmailBatch {
  to: string;
  template: string;
  data: any;
  attachments?: Array<{ filename: string; content: Buffer }>;
}

export interface IInAppMessage {
  type: 'banner' | 'modal' | 'card';
  title?: string;
  body: string;
  actions?: Array<{ label: string; action: string }>;
  dismissible?: boolean;
  priority?: 'low' | 'medium' | 'high';
}

export interface IAggregationPipeline {
  stages: Array<{
    $match?: any;
    $group?: any;
    $sort?: any;
    $limit?: number;
    $skip?: number;
    $project?: any;
    $lookup?: any;
    $unwind?: any;
  }>;
}

export type IOperator = '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'not-in' | 'contains' | 'array-contains';

export type IUnsubscribe = () => void;

// Provider Factory Type
export type ProviderType = 'firebase' | 'cloudflare' | 'aws' | 'azure' | 'supabase' | 'custom';

// Provider Configuration
export interface IProviderConfig {
  type: ProviderType;
  credentials?: any;
  region?: string;
  endpoint?: string;
  options?: Record<string, any>;
}