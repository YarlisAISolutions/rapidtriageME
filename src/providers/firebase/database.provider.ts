/**
 * Firestore Database Provider
 * Implements IDatabaseProvider interface for Firestore
 */

import {
  IDatabaseProvider,
  IQueryOptions,
  IQueryResult,
  ITransactionOperation,
  IIndexDefinition,
  IUnsubscribe,
  IAggregationPipeline,
  IOperator
} from '../interfaces';

import { FirebaseApp } from 'firebase/app';
import {
  Firestore,
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  offset,
  startAfter,
  Query,
  DocumentData,
  QueryConstraint,
  onSnapshot,
  writeBatch,
  runTransaction,
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

export class FirestoreProvider implements IDatabaseProvider {
  private db: Firestore;

  constructor(app: FirebaseApp) {
    this.db = getFirestore(app);
  }

  /**
   * Create a document in a collection
   */
  async create<T>(collectionName: string, data: T): Promise<string> {
    try {
      // Add timestamps
      const documentData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(this.db, collectionName), documentData);
      return docRef.id;
    } catch (error: any) {
      throw new Error(`Failed to create document: ${error.message}`);
    }
  }

  /**
   * Read a document from a collection
   */
  async read<T>(collectionName: string, id: string): Promise<T | null> {
    try {
      const docRef = doc(this.db, collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return { ...data, id: docSnap.id } as T;
    } catch (error: any) {
      throw new Error(`Failed to read document: ${error.message}`);
    }
  }

  /**
   * Update a document in a collection
   */
  async update<T>(collectionName: string, id: string, data: Partial<T>): Promise<void> {
    try {
      const docRef = doc(this.db, collectionName, id);

      // Add update timestamp
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, updateData as any);
    } catch (error: any) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }

  /**
   * Delete a document from a collection
   */
  async delete(collectionName: string, id: string): Promise<void> {
    try {
      const docRef = doc(this.db, collectionName, id);
      await deleteDoc(docRef);
    } catch (error: any) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  /**
   * Batch create multiple documents
   */
  async batchCreate<T>(collectionName: string, items: T[]): Promise<string[]> {
    try {
      const batch = writeBatch(this.db);
      const ids: string[] = [];

      for (const item of items) {
        const docRef = doc(collection(this.db, collectionName));
        const documentData = {
          ...item,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        batch.set(docRef, documentData);
        ids.push(docRef.id);
      }

      await batch.commit();
      return ids;
    } catch (error: any) {
      throw new Error(`Failed to batch create documents: ${error.message}`);
    }
  }

  /**
   * Batch update multiple documents
   */
  async batchUpdate<T>(collectionName: string, updates: { id: string; data: Partial<T> }[]): Promise<void> {
    try {
      const batch = writeBatch(this.db);

      for (const update of updates) {
        const docRef = doc(this.db, collectionName, update.id);
        const updateData = {
          ...update.data,
          updatedAt: serverTimestamp()
        };
        batch.update(docRef, updateData);
      }

      await batch.commit();
    } catch (error: any) {
      throw new Error(`Failed to batch update documents: ${error.message}`);
    }
  }

  /**
   * Batch delete multiple documents
   */
  async batchDelete(collectionName: string, ids: string[]): Promise<void> {
    try {
      const batch = writeBatch(this.db);

      for (const id of ids) {
        const docRef = doc(this.db, collectionName, id);
        batch.delete(docRef);
      }

      await batch.commit();
    } catch (error: any) {
      throw new Error(`Failed to batch delete documents: ${error.message}`);
    }
  }

  /**
   * Query documents in a collection
   */
  async query<T>(collectionName: string, options: IQueryOptions): Promise<IQueryResult<T>> {
    try {
      const constraints: QueryConstraint[] = [];

      // Build where clauses
      if (options.where) {
        for (const [field, operator, value] of options.where) {
          constraints.push(where(field, this.mapOperator(operator), value));
        }
      }

      // Build orderBy clauses
      if (options.orderBy) {
        for (const [field, direction] of options.orderBy) {
          constraints.push(orderBy(field, direction));
        }
      }

      // Add limit
      if (options.limit) {
        constraints.push(limit(options.limit));
      }

      // Create query
      const q = query(collection(this.db, collectionName), ...constraints);

      // Execute query
      const snapshot = await getDocs(q);

      // Map results
      const data: T[] = [];
      snapshot.forEach((doc) => {
        const docData = doc.data();
        data.push({ ...docData, id: doc.id } as T);
      });

      // Check if there are more results
      const hasMore = options.limit ? data.length === options.limit : false;

      return {
        data,
        total: data.length,
        hasMore,
        cursor: hasMore && data.length > 0 ? data[data.length - 1]['id'] : undefined
      };
    } catch (error: any) {
      throw new Error(`Failed to query documents: ${error.message}`);
    }
  }

  /**
   * Aggregate data in a collection
   * Note: Firestore doesn't have native aggregation like MongoDB
   * This implementation simulates aggregation functionality
   */
  async aggregate<T>(collectionName: string, pipeline: IAggregationPipeline): Promise<T[]> {
    try {
      // Start with all documents
      let results: any[] = [];
      const snapshot = await getDocs(collection(this.db, collectionName));

      snapshot.forEach((doc) => {
        results.push({ ...doc.data(), id: doc.id });
      });

      // Process pipeline stages
      for (const stage of pipeline.stages) {
        if (stage.$match) {
          // Filter results
          results = results.filter(doc => this.matchDocument(doc, stage.$match));
        }

        if (stage.$group) {
          // Group results
          results = this.groupDocuments(results, stage.$group);
        }

        if (stage.$sort) {
          // Sort results
          results = this.sortDocuments(results, stage.$sort);
        }

        if (stage.$limit) {
          // Limit results
          results = results.slice(0, stage.$limit);
        }

        if (stage.$skip) {
          // Skip results
          results = results.slice(stage.$skip);
        }

        if (stage.$project) {
          // Project fields
          results = results.map(doc => this.projectDocument(doc, stage.$project));
        }
      }

      return results as T[];
    } catch (error: any) {
      throw new Error(`Failed to aggregate documents: ${error.message}`);
    }
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(operations: ITransactionOperation[]): Promise<T> {
    try {
      return await runTransaction(this.db, async (transaction) => {
        const results: any[] = [];

        for (const operation of operations) {
          switch (operation.type) {
            case 'create':
              const createRef = doc(collection(this.db, operation.collection));
              transaction.set(createRef, {
                ...operation.data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
              results.push({ id: createRef.id });
              break;

            case 'update':
              if (!operation.id) throw new Error('Update operation requires an id');
              const updateRef = doc(this.db, operation.collection, operation.id);
              transaction.update(updateRef, {
                ...operation.data,
                updatedAt: serverTimestamp()
              });
              results.push({ id: operation.id });
              break;

            case 'delete':
              if (!operation.id) throw new Error('Delete operation requires an id');
              const deleteRef = doc(this.db, operation.collection, operation.id);
              transaction.delete(deleteRef);
              results.push({ id: operation.id });
              break;
          }
        }

        return results as T;
      });
    } catch (error: any) {
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  /**
   * Subscribe to document changes
   */
  subscribe<T>(collectionName: string, id: string, callback: (data: T) => void): IUnsubscribe {
    const docRef = doc(this.db, collectionName, id);

    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = { ...doc.data(), id: doc.id } as T;
        callback(data);
      }
    });

    return unsubscribe;
  }

  /**
   * Subscribe to query changes
   */
  subscribeToQuery<T>(collectionName: string, queryOptions: IQueryOptions, callback: (data: T[]) => void): IUnsubscribe {
    const constraints: QueryConstraint[] = [];

    // Build where clauses
    if (queryOptions.where) {
      for (const [field, operator, value] of queryOptions.where) {
        constraints.push(where(field, this.mapOperator(operator), value));
      }
    }

    // Build orderBy clauses
    if (queryOptions.orderBy) {
      for (const [field, direction] of queryOptions.orderBy) {
        constraints.push(orderBy(field, direction));
      }
    }

    // Add limit
    if (queryOptions.limit) {
      constraints.push(limit(queryOptions.limit));
    }

    const q = query(collection(this.db, collectionName), ...constraints);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: T[] = [];
      snapshot.forEach((doc) => {
        data.push({ ...doc.data(), id: doc.id } as T);
      });
      callback(data);
    });

    return unsubscribe;
  }

  /**
   * Create an index
   * Note: Firestore indexes are typically created through Firebase Console or CLI
   */
  async createIndex(collectionName: string, index: IIndexDefinition): Promise<void> {
    // Firestore indexes are managed through Firebase Console or firebase.json
    // This is a placeholder that logs the index requirement
    console.log(`Index required for collection ${collectionName}:`, index);

    // In production, you would:
    // 1. Add index to firestore.indexes.json
    // 2. Deploy with Firebase CLI
    // Or create through Firebase Console
  }

  /**
   * Drop an index
   */
  async dropIndex(collectionName: string, indexName: string): Promise<void> {
    // Similar to createIndex, this is managed through Firebase Console or CLI
    console.log(`Drop index ${indexName} from collection ${collectionName}`);
  }

  // Helper methods

  private mapOperator(operator: IOperator): any {
    const operatorMap: Record<IOperator, any> = {
      '==': '==',
      '!=': '!=',
      '<': '<',
      '<=': '<=',
      '>': '>',
      '>=': '>=',
      'in': 'in',
      'not-in': 'not-in',
      'contains': 'array-contains',
      'array-contains': 'array-contains'
    };

    return operatorMap[operator] || '==';
  }

  private matchDocument(doc: any, conditions: any): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      if (typeof value === 'object' && value !== null) {
        // Handle nested conditions
        for (const [op, val] of Object.entries(value)) {
          if (!this.evaluateCondition(doc[key], op, val)) {
            return false;
          }
        }
      } else {
        // Simple equality check
        if (doc[key] !== value) {
          return false;
        }
      }
    }
    return true;
  }

  private evaluateCondition(fieldValue: any, operator: string, value: any): boolean {
    switch (operator) {
      case '$eq':
        return fieldValue === value;
      case '$ne':
        return fieldValue !== value;
      case '$gt':
        return fieldValue > value;
      case '$gte':
        return fieldValue >= value;
      case '$lt':
        return fieldValue < value;
      case '$lte':
        return fieldValue <= value;
      case '$in':
        return Array.isArray(value) && value.includes(fieldValue);
      case '$nin':
        return Array.isArray(value) && !value.includes(fieldValue);
      default:
        return fieldValue === value;
    }
  }

  private groupDocuments(documents: any[], groupSpec: any): any[] {
    const groups = new Map();

    for (const doc of documents) {
      const key = doc[groupSpec._id];
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(doc);
    }

    const results = [];
    for (const [key, docs] of groups.entries()) {
      const group: any = { _id: key };

      // Process aggregation functions
      for (const [field, spec] of Object.entries(groupSpec)) {
        if (field === '_id') continue;

        if (typeof spec === 'object' && spec !== null) {
          const operation = Object.keys(spec)[0];
          const fieldName = Object.values(spec)[0] as string;

          switch (operation) {
            case '$sum':
              group[field] = docs.reduce((sum: number, doc: any) => sum + (doc[fieldName] || 0), 0);
              break;
            case '$avg':
              const total = docs.reduce((sum: number, doc: any) => sum + (doc[fieldName] || 0), 0);
              group[field] = total / docs.length;
              break;
            case '$min':
              group[field] = Math.min(...docs.map((doc: any) => doc[fieldName] || 0));
              break;
            case '$max':
              group[field] = Math.max(...docs.map((doc: any) => doc[fieldName] || 0));
              break;
            case '$count':
              group[field] = docs.length;
              break;
          }
        }
      }

      results.push(group);
    }

    return results;
  }

  private sortDocuments(documents: any[], sortSpec: any): any[] {
    return documents.sort((a, b) => {
      for (const [field, order] of Object.entries(sortSpec)) {
        const aValue = a[field];
        const bValue = b[field];

        if (aValue < bValue) return order === 1 ? -1 : 1;
        if (aValue > bValue) return order === 1 ? 1 : -1;
      }
      return 0;
    });
  }

  private projectDocument(doc: any, projection: any): any {
    const result: any = {};

    for (const [field, include] of Object.entries(projection)) {
      if (include === 1 || include === true) {
        result[field] = doc[field];
      } else if (typeof include === 'string') {
        // Rename field
        result[field] = doc[include];
      }
    }

    return result;
  }
}