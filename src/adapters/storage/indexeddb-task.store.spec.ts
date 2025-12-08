import { describe, it, expect, beforeEach, vi } from 'vitest';
import { firstValueFrom, take, timeout } from 'rxjs';
import { IndexedDbTaskStore } from './indexeddb-task.store';
import { Task, TaskSchema } from '../../core/models/task';
import { SyncBus, SyncMessage } from '../../core/ports/sync-bus.provider';
import { Observable, Subject } from 'rxjs';

// Mock SyncBus for testing
class MockSyncBus implements SyncBus {
  private subject = new Subject<SyncMessage>();

  publish(message: SyncMessage): void {
    this.subject.next(message);
  }

  subscribe(channel: string): Observable<SyncMessage> {
    return this.subject.asObservable();
  }
}

// Override Angular inject
vi.mock('@angular/core', async () => {
  const actual = await vi.importActual('@angular/core');
  return {
    ...actual,
    inject: vi.fn(() => new MockSyncBus()),
  };
});

describe('IndexedDbTaskStore', () => {
  let store: IndexedDbTaskStore;

  const createValidTask = (overrides?: Partial<Task>): Task => ({
    id: '550e8400-e29b-41d4-a716-446655440000',
    sessionId: 'ABC123',
    content: 'Test task',
    isSecret: false,
    revealVotes: 0,
    voterIds: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  });

  beforeEach(() => {
    store = new IndexedDbTaskStore();
  });

  describe('save', () => {
    it('should save a valid task', async () => {
      const task = createValidTask();
      await store.save(task);

      const tasks = await store.list(task.sessionId);
      expect(tasks.some((t) => t.id === task.id)).toBe(true);
    });

    it('should validate task before saving', async () => {
      const invalidTask = { ...createValidTask(), id: 'not-a-uuid' };
      await expect(store.save(invalidTask as Task)).rejects.toThrow();
    });

    it('should update existing task with same id', async () => {
      const task = createValidTask();
      await store.save(task);

      const updatedTask = { ...task, content: 'Updated content' };
      await store.save(updatedTask);

      const tasks = await store.list(task.sessionId);
      const found = tasks.find((t) => t.id === task.id);
      expect(found?.content).toBe('Updated content');
    });
  });

  describe('list', () => {
    it('should list tasks by sessionId', async () => {
      const task1 = createValidTask({
        id: '550e8400-e29b-41d4-a716-446655440001',
        sessionId: 'ABC123',
      });
      const task2 = createValidTask({
        id: '550e8400-e29b-41d4-a716-446655440002',
        sessionId: 'XYZ789',
      });

      await store.save(task1);
      await store.save(task2);

      const abcTasks = await store.list('ABC123');
      const xyzTasks = await store.list('XYZ789');

      expect(abcTasks.some((t) => t.id === task1.id)).toBe(true);
      expect(xyzTasks.some((t) => t.id === task2.id)).toBe(true);
    });

    it('should return empty array for session with no tasks', async () => {
      const tasks = await store.list('NONEXISTENT');
      expect(tasks).toEqual([]);
    });
  });

  describe('watch', () => {
    it('should return an observable', () => {
      const observable = store.watch('ABC123');
      expect(observable).toHaveProperty('subscribe');
    });

    it('should emit initial data', async () => {
      const task = createValidTask();
      await store.save(task);

      const tasks = await firstValueFrom(
        store.watch(task.sessionId).pipe(take(1), timeout(1000))
      );

      expect(tasks.some((t) => t.id === task.id)).toBe(true);
    });
  });
});

// Additional unit tests for TaskSchema validation (contributing to coverage)
describe('Task Schema Validation', () => {
  const createValidTask = (overrides?: Partial<Task>): Task => ({
    id: '550e8400-e29b-41d4-a716-446655440000',
    sessionId: 'ABC123',
    content: 'Test task',
    isSecret: false,
    revealVotes: 0,
    voterIds: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  });

  it('should validate task before saving', () => {
    const task = createValidTask();
    expect(() => TaskSchema.parse(task)).not.toThrow();
  });

  it('should reject invalid task id', () => {
    const invalidTask = createValidTask({ id: 'not-a-uuid' });
    expect(() => TaskSchema.parse(invalidTask)).toThrow();
  });

  it('should reject invalid sessionId format', () => {
    const task = createValidTask();
    const invalidTask = { ...task, sessionId: 'invalid' };
    expect(() => TaskSchema.parse(invalidTask)).toThrow();
  });

  it('should accept valid task with all properties', () => {
    const task = createValidTask({
      content: 'Valid content',
      isSecret: true,
      revealVotes: 2,
      voterIds: [
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002',
      ],
    });
    expect(() => TaskSchema.parse(task)).not.toThrow();
  });

  it('should handle task with max content length', () => {
    const task = createValidTask({ content: 'a'.repeat(200) });
    expect(() => TaskSchema.parse(task)).not.toThrow();
  });

  it('should reject task exceeding max content length', () => {
    const task = createValidTask({ content: 'a'.repeat(201) });
    expect(() => TaskSchema.parse(task)).toThrow();
  });
});
