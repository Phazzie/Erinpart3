import { Injectable, inject } from '@angular/core';
import { Observable, from, of, switchMap, startWith } from 'rxjs';
import { Task, TaskSchema } from '../../core/models/task';
import { TaskStore } from '../../core/ports/task-store.provider';
import { SyncBus } from '../../core/ports/sync-bus.provider';

const DB_NAME = 'ErinsEscapadesDB';
const DB_VERSION = 1;
const TASK_STORE_NAME = 'tasks';

@Injectable({ providedIn: 'root' })
export class IndexedDbTaskStore implements TaskStore {
  private dbPromise: Promise<IDBDatabase>;
  private syncBus = inject(SyncBus);

  constructor() {
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(TASK_STORE_NAME)) {
          const store = db.createObjectStore(TASK_STORE_NAME, { keyPath: 'id' });
          store.createIndex('sessionId', 'sessionId', { unique: false });
        }
      };
    });
  }

  private async getStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const db = await this.dbPromise;
    return db.transaction(TASK_STORE_NAME, mode).objectStore(TASK_STORE_NAME);
  }

  async list(sessionId: string): Promise<Task[]> {
    const store = await this.getStore('readonly');
    const index = store.index('sessionId');
    const request = index.getAll(sessionId);
    
    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const tasks = request.result.map(t => TaskSchema.parse(t));
        resolve(tasks);
      };
    });
  }

  async save(task: Task): Promise<void> {
    TaskSchema.parse(task); // Validate before saving
    const store = await this.getStore('readwrite');
    const request = store.put(task);
    
    return new Promise<void>((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  watch(sessionId: string): Observable<Task[]> {
    const sync$ = this.syncBus.subscribe(sessionId);
    
    return sync$.pipe(
      startWith(null), // Emit immediately to load initial data
      switchMap(() => from(this.list(sessionId)))
    );
  }
}