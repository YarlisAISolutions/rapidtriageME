/**
 * Firebase Admin Mock
 * This mock is automatically used by Jest when firebase-admin is imported
 */

const mockTimestamp = {
  toDate: jest.fn(() => new Date()),
  toMillis: jest.fn(() => Date.now()),
};

const mockFieldValue = {
  serverTimestamp: jest.fn(() => mockTimestamp),
  increment: jest.fn((n: number) => n),
  arrayUnion: jest.fn((...args: any[]) => args),
  arrayRemove: jest.fn((...args: any[]) => args),
  delete: jest.fn(() => null),
};

const mockDocumentSnapshot = {
  exists: true,
  id: 'mock-doc-id',
  data: jest.fn(() => ({
    createdAt: mockTimestamp,
    updatedAt: mockTimestamp,
  })),
  get: jest.fn((field: string) => null),
  ref: {
    id: 'mock-doc-id',
    path: 'mock/path',
  },
};

const mockQuerySnapshot = {
  empty: false,
  size: 1,
  docs: [mockDocumentSnapshot],
  forEach: jest.fn((callback: (doc: any) => void) => {
    callback(mockDocumentSnapshot);
  }),
};

const mockDocRef = {
  id: 'mock-doc-id',
  path: 'mock/path',
  get: jest.fn(() => Promise.resolve(mockDocumentSnapshot)),
  set: jest.fn(() => Promise.resolve()),
  update: jest.fn(() => Promise.resolve()),
  delete: jest.fn(() => Promise.resolve()),
  collection: jest.fn(() => mockCollectionRef),
  onSnapshot: jest.fn(),
};

const mockCollectionRef: any = {
  doc: jest.fn(() => mockDocRef),
  add: jest.fn(() => Promise.resolve(mockDocRef)),
  get: jest.fn(() => Promise.resolve(mockQuerySnapshot)),
  where: jest.fn(() => mockCollectionRef),
  orderBy: jest.fn(() => mockCollectionRef),
  limit: jest.fn(() => mockCollectionRef),
  startAfter: jest.fn(() => mockCollectionRef),
  onSnapshot: jest.fn(),
};

const mockBatch: any = {
  set: jest.fn(function() { return mockBatch; }),
  update: jest.fn(function() { return mockBatch; }),
  delete: jest.fn(function() { return mockBatch; }),
  commit: jest.fn(() => Promise.resolve()),
};

const mockTransaction: any = {
  get: jest.fn(() => Promise.resolve(mockDocumentSnapshot)),
  set: jest.fn(function() { return mockTransaction; }),
  update: jest.fn(function() { return mockTransaction; }),
  delete: jest.fn(function() { return mockTransaction; }),
};

const mockFirestore = {
  collection: jest.fn(() => mockCollectionRef),
  doc: jest.fn(() => mockDocRef),
  batch: jest.fn(() => mockBatch),
  runTransaction: jest.fn((callback: (t: any) => Promise<any>) => callback(mockTransaction)),
  settings: jest.fn(),
  FieldValue: mockFieldValue,
  Timestamp: {
    now: jest.fn(() => mockTimestamp),
    fromDate: jest.fn((date: Date) => mockTimestamp),
  },
};

const mockAuth = {
  verifyIdToken: jest.fn(() => Promise.resolve({ uid: 'mock-uid', email: 'test@example.com' })),
  createUser: jest.fn(() => Promise.resolve({ uid: 'new-user-id' })),
  updateUser: jest.fn(() => Promise.resolve()),
  deleteUser: jest.fn(() => Promise.resolve()),
  getUser: jest.fn(() => Promise.resolve({ uid: 'mock-uid', email: 'test@example.com' })),
  getUserByEmail: jest.fn(() => Promise.resolve({ uid: 'mock-uid', email: 'test@example.com' })),
  listUsers: jest.fn(() => Promise.resolve({ users: [] })),
  setCustomUserClaims: jest.fn(() => Promise.resolve()),
  createCustomToken: jest.fn(() => Promise.resolve('mock-custom-token')),
};

const mockBucket = {
  file: jest.fn(() => ({
    save: jest.fn(() => Promise.resolve()),
    download: jest.fn(() => Promise.resolve([Buffer.from('mock-data')])),
    delete: jest.fn(() => Promise.resolve()),
    exists: jest.fn(() => Promise.resolve([true])),
    getSignedUrl: jest.fn(() => Promise.resolve(['https://mock-signed-url.com'])),
    makePublic: jest.fn(() => Promise.resolve()),
    getMetadata: jest.fn(() => Promise.resolve([{ size: 1024 }])),
  })),
  upload: jest.fn(() => Promise.resolve()),
  getFiles: jest.fn(() => Promise.resolve([[]])),
};

const mockStorage = {
  bucket: jest.fn(() => mockBucket),
};

const mockApp = {
  name: '[DEFAULT]',
  options: {},
};

const admin = {
  initializeApp: jest.fn(() => mockApp),
  app: jest.fn(() => mockApp),
  apps: [mockApp],
  firestore: Object.assign(jest.fn(() => mockFirestore), {
    FieldValue: mockFieldValue,
    Timestamp: mockFirestore.Timestamp,
  }),
  auth: jest.fn(() => mockAuth),
  storage: jest.fn(() => mockStorage),
  credential: {
    applicationDefault: jest.fn(),
    cert: jest.fn(),
  },
};

export = admin;
