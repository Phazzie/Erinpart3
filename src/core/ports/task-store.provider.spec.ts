import { describe, it, expect, vi } from 'vitest';
import { Observable, of, Subject, firstValueFrom } from 'rxjs';
import { Task } from '../models/task';

// Test the TaskStore interface contract
describe('TaskStore Interface Contract', () => {
  // Mock implementation that follows the interface
  const createMockTaskStore = () => ({
    list: vi.fn<[string], Promise<Task[]>>().mockResolvedValue([]),
    save: vi.fn<[Task], Promise<void>>().mockResolvedValue(undefined),
    watch: vi.fn<[string], Observable<Task[]>>().mockReturnValue(of([])),
  });

  const createTask = (overrides?: Partial<Task>): Task => ({
    id: '550e8400-e29b-41d4-a716-446655440000',
    sessionId: 'ABC123',
    content: 'Test task',
    isSecret: false,
    revealVotes: 0,
    voterIds: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  });

  describe('list method', () => {
    it('should accept sessionId parameter', async () => {
      const store = createMockTaskStore();

      await store.list('ABC123');

      expect(store.list).toHaveBeenCalledWith('ABC123');
    });

    it('should return Promise<Task[]>', async () => {
      const tasks = [createTask()];
      const store = createMockTaskStore();
      store.list.mockResolvedValue(tasks);

      const result = await store.list('ABC123');

      expect(result).toEqual(tasks);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when no tasks', async () => {
      const store = createMockTaskStore();

      const result = await store.list('EMPTY1');

      expect(result).toEqual([]);
    });
  });

  describe('save method', () => {
    it('should accept Task parameter', async () => {
      const store = createMockTaskStore();
      const task = createTask();

      await store.save(task);

      expect(store.save).toHaveBeenCalledWith(task);
    });

    it('should return Promise<void>', async () => {
      const store = createMockTaskStore();
      const task = createTask();

      const result = await store.save(task);

      expect(result).toBeUndefined();
    });

    it('should be able to reject on error', async () => {
      const store = createMockTaskStore();
      store.save.mockRejectedValue(new Error('Save failed'));

      await expect(store.save(createTask())).rejects.toThrow('Save failed');
    });
  });

  describe('watch method', () => {
    it('should accept sessionId parameter', () => {
      const store = createMockTaskStore();

      store.watch('ABC123');

      expect(store.watch).toHaveBeenCalledWith('ABC123');
    });

    it('should return Observable<Task[]>', async () => {
      const tasks = [createTask()];
      const store = createMockTaskStore();
      store.watch.mockReturnValue(of(tasks));

      const observable = store.watch('ABC123');
      const result = await firstValueFrom(observable);

      expect(result).toEqual(tasks);
    });

    it('should emit updates when tasks change', () => {
      const store = createMockTaskStore();
      const subject = new Subject<Task[]>();
      store.watch.mockReturnValue(subject.asObservable());

      const emissions: Task[][] = [];
      const subscription = store.watch('ABC123').subscribe((tasks) => {
        emissions.push(tasks);
      });

      subject.next([]);
      subject.next([createTask()]);

      expect(emissions).toHaveLength(2);
      expect(emissions[0]).toEqual([]);
      expect(emissions[1]).toHaveLength(1);

      subscription.unsubscribe();
    });
  });
});
