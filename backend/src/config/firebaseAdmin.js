import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let db;
let auth;
let storage;
let isMock = false;

// In-Memory store for mock mode with file-based persistence for test runs
const MOCK_DATA_FILE = path.resolve(process.cwd(), 'src/config/mock-db.json');

function syncStore(store) {
  try {
    if (fs.existsSync(MOCK_DATA_FILE)) {
      const raw = fs.readFileSync(MOCK_DATA_FILE, 'utf8');
      const loaded = JSON.parse(raw);
      for (const k of Object.keys(store)) {
        if (!(k in loaded)) delete store[k];
      }
      Object.assign(store, loaded);
    }
  } catch {
    // Ignore read errors
  }
}

class MockDocRef {
  constructor(collectionPath, id, store) {
    this.collectionPath = collectionPath;
    this.id = id;
    this.store = store;
  }

  async get() {
    syncStore(this.store);
    const fullPath = `${this.collectionPath}/${this.id}`;
    const data = this.store[fullPath];
    return {
      exists: !!data,
      id: this.id,
      data: () => (data ? JSON.parse(JSON.stringify(data)) : undefined)
    };
  }

  async set(data, options = {}) {
    const fullPath = `${this.collectionPath}/${this.id}`;
    if (options.merge && this.store[fullPath]) {
      this.store[fullPath] = { ...this.store[fullPath], ...data };
    } else {
      this.store[fullPath] = { ...data };
    }
    this.savePersistedStore();
    return { id: this.id };
  }

  async update(patch) {
    const fullPath = `${this.collectionPath}/${this.id}`;
    if (!this.store[fullPath]) {
      throw new Error(`Document ${fullPath} not found for update`);
    }
    this.store[fullPath] = { ...this.store[fullPath], ...patch };
    this.savePersistedStore();
    return { id: this.id };
  }

  async delete() {
    const fullPath = `${this.collectionPath}/${this.id}`;
    delete this.store[fullPath];
    this.savePersistedStore();
    return true;
  }

  collection(subCollectionName) {
    const subPath = `${this.collectionPath}/${this.id}/${subCollectionName}`;
    return new MockCollectionRef(subPath, this.store);
  }

  savePersistedStore() {
    try {
      const dir = path.dirname(MOCK_DATA_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(MOCK_DATA_FILE, JSON.stringify(this.store, null, 2), 'utf8');
    } catch {
      // Ignore write failures in memory-only environments
    }
  }
}

class MockQuery {
  constructor(collectionPath, store, filters = [], limitCount = null, orderField = null, orderDir = 'asc') {
    this.collectionPath = collectionPath;
    this.store = store;
    this.filters = filters;
    this.limitCount = limitCount;
    this.orderField = orderField;
    this.orderDir = orderDir;
  }

  where(field, op, value) {
    const nextFilters = [...this.filters, { field, op, value }];
    return new MockQuery(this.collectionPath, this.store, nextFilters, this.limitCount, this.orderField, this.orderDir);
  }

  orderBy(field, dir = 'asc') {
    return new MockQuery(this.filters, this.store, this.filters, this.limitCount, field, dir);
  }

  limit(count) {
    return new MockQuery(this.collectionPath, this.store, this.filters, count, this.orderField, this.orderDir);
  }

  async get() {
    syncStore(this.store);
    // Find all documents whose fullPath starts with this.collectionPath + '/' and has no further slashes
    const prefix = `${this.collectionPath}/`;
    const docKeys = Object.keys(this.store).filter(key => {
      if (!key.startsWith(prefix)) return false;
      const sub = key.slice(prefix.length);
      return !sub.includes('/');
    });

    let results = docKeys.map(key => {
      const id = key.slice(prefix.length);
      const data = this.store[key];
      return {
        id,
        exists: true,
        data: () => JSON.parse(JSON.stringify(data))
      };
    });

    // Apply where filters
    for (const filter of this.filters) {
      results = results.filter(doc => {
        const val = doc.data()[filter.field];
        switch (filter.op) {
          case '==':
            return val === filter.value;
          case '!=':
            return val !== filter.value;
          case '>':
            return val > filter.value;
          case '>=':
            return val >= filter.value;
          case '<':
            return val < filter.value;
          case '<=':
            return val <= filter.value;
          case 'array-contains':
            return Array.isArray(val) && val.includes(filter.value);
          case 'in':
            return Array.isArray(filter.value) && filter.value.includes(val);
          default:
            return val === filter.value;
        }
      });
    }

    // Apply ordering
    if (this.orderField) {
      results.sort((a, b) => {
        const valA = a.data()[this.orderField];
        const valB = b.data()[this.orderField];
        if (valA < valB) return this.orderDir === 'asc' ? -1 : 1;
        if (valA > valB) return this.orderDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply limit
    if (this.limitCount && this.limitCount > 0) {
      results = results.slice(0, this.limitCount);
    }

    return {
      empty: results.length === 0,
      size: results.length,
      docs: results
    };
  }
}

class MockCollectionRef extends MockQuery {
  constructor(collectionPath, store) {
    super(collectionPath, store);
  }

  doc(id) {
    const docId = id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return new MockDocRef(this.collectionPath, docId, this.store);
  }

  async add(data) {
    const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const docRef = this.doc(docId);
    await docRef.set(data);
    return docRef;
  }
}

function loadInitialStore() {
  try {
    if (fs.existsSync(MOCK_DATA_FILE)) {
      const raw = fs.readFileSync(MOCK_DATA_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch {
    // start empty
  }
  return {};
}

const mockStore = loadInitialStore();

const mockAuth = {
  verifyIdToken: async (token) => {
    if (!token || typeof token !== 'string') {
      const err = new Error('No token provided');
      err.code = 'auth/invalid-argument';
      throw err;
    }

    // Support test mock tokens
    if (token === 'mock-token-admin' || token === 'admin-token') {
      return {
        uid: 'u_admin_001',
        email: 'admin@betterself.pk',
        name: 'Dr. Ayesha Admin',
        admin: true
      };
    }

    if (token === 'mock-token-student' || token === 'student-token' || token === 'mock-token-student-1') {
      return {
        uid: 'u_123',
        email: 'student@example.com',
        name: 'Zainab Fatima',
        admin: false
      };
    }

    if (token === 'mock-token-expired' || token === 'expired-token') {
      return {
        uid: 'u_expired',
        email: 'expired@example.com',
        name: 'Expired Trial User',
        admin: false
      };
    }

    if (token.startsWith('mock-token-custom:')) {
      const parts = token.split(':');
      const uid = parts[1] || 'u_custom';
      const email = parts[2] || `${uid}@example.com`;
      const isAdmin = parts[3] === 'true';
      return {
        uid,
        email,
        name: `User ${uid}`,
        admin: isAdmin
      };
    }

    // Try parsing as JSON if passed during mock testing
    try {
      const parsed = JSON.parse(token);
      if (parsed.uid) return parsed;
    } catch {
      // not JSON
    }

    const err = new Error('Invalid or expired Firebase ID token');
    err.code = 'auth/argument-error';
    throw err;
  }
};

const mockStorage = {
  bucket: () => ({
    file: (name) => ({
      getSignedUrl: async () => [`https://storage.googleapis.com/betterself-lms.appspot.com/${name}`],
      save: async () => true
    })
  })
};

// Initialization logic: use live Firebase Admin SDK if credentials exist and MOCK_FIREBASE is not forced
const shouldUseLiveFirebase =
  process.env.MOCK_FIREBASE !== 'true' &&
  (Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS) ||
    Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) ||
    (Boolean(process.env.FIREBASE_PROJECT_ID) &&
      Boolean(process.env.FIREBASE_CLIENT_EMAIL) &&
      Boolean(process.env.FIREBASE_PRIVATE_KEY) &&
      !process.env.FIREBASE_PROJECT_ID.includes('your-firebase-project-id')));

if (shouldUseLiveFirebase) {
  try {
    if (!admin.apps.length) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        });
      } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
          }),
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        });
      } else {
        admin.initializeApp();
      }
    }
    db = admin.firestore();
    auth = admin.auth();
    storage = admin.storage();
    isMock = false;
    console.log('[FirebaseAdmin] Connected to Live Firebase Project:', admin.app().options.projectId || 'Default');
  } catch (err) {
    console.warn('[FirebaseAdmin] Failed initializing live Firebase SDK, falling back to mock engine:', err.message);
    isMock = true;
    db = { collection: (col) => new MockCollectionRef(col, mockStore) };
    auth = mockAuth;
    storage = mockStorage;
  }
} else {
  isMock = true;
  db = { collection: (col) => new MockCollectionRef(col, mockStore) };
  auth = mockAuth;
  storage = mockStorage;
  console.log('[FirebaseAdmin] Running in High-Fidelity Mock Mode (Zero external dependencies).');
}

export { db, auth, storage, isMock, mockStore };
