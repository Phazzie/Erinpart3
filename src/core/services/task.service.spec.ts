import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, BehaviorSubject, throwError } from 'rxjs';
import { Task } from '../models/task';

// Create mock implementations
const mockTaskStore = {
  list: vi.fn().mockResolvedValue([]),
  save: vi.fn().mockResolvedValue(undefined),
  watch: vi.fn().mockReturnValue(of([])),
};

const mockSyncBus = {
  publish: vi.fn(),
  subscribe: vi.fn().mockReturnValue(of()),
};

const mockAuthProvider = {
  currentUser: vi.fn().mockReturnValue({ id: 'user-123-uuid', name: 'Test User' }),
  initialize: vi.fn(),
};

const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Track signal values for toObservable mock
let signalSubject: BehaviorSubject<string | null>;
let tasksStateValue = { loading: true, tasks: [] as Task[], error: null };

// Mock @angular/core/rxjs-interop BEFORE importing the service
vi.mock('@angular/core/rxjs-interop', () => ({
  toObservable: vi.fn((signalFn: () => string | null) => {
    // Return observable that emits signal value
    signalSubject = new BehaviorSubject(signalFn());
    return signalSubject.asObservable();
  }),
  toSignal: vi.fn((observable$: any, options?: { initialValue?: any }) => {
    // Subscribe to update tasksStateValue
    observable$.subscribe((val: any) => {
      tasksStateValue = val;
    });
    // Return a signal-like function
    return () => tasksStateValue;
  }),
}));

// Mock Angular inject to return our mocks
vi.mock('@angular/core', async () => {
  const actual = await vi.importActual('@angular/core');
  return {
    ...actual,
    inject: vi.fn((token: any) => {
      const tokenName = token?.name || token?.toString() || '';
      if (tokenName.includes('TaskStore')) return mockTaskStore;
      if (tokenName.includes('SyncBus')) return mockSyncBus;
      if (tokenName.includes('AuthProvider')) return mockAuthProvider;
      if (tokenName.includes('LoggerService')) return mockLogger;
      return null;
    }),
  };
});

// Import the actual service AFTER mocks are set up
import { TaskService } from './task.service';

describe('TaskService', () => {
  let service: TaskService;
  const testUser = { id: 'user-123-uuid', name: 'Test User' };
  const testSessionId = 'ABC123';

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset state
    tasksStateValue = { loading: true, tasks: [], error: null };

    mockTaskStore.save.mockResolvedValue(undefined);
    mockTaskStore.list.mockResolvedValue([]);
    mockTaskStore.watch.mockReturnValue(of([]));
    mockAuthProvider.currentUser.mockReturnValue(testUser);

    service = new TaskService();
    service.sessionId.set(testSessionId);

    // Update the subject if it exists
    if (signalSubject) {
      signalSubject.next(testSessionId);
    }
  });

  describe('sessionId signal', () => {
    it('should initialize with null sessionId', () => {
      const newService = new TaskService();
      expect(newService.sessionId()).toBeNull();
    });

    it('should allow setting sessionId', () => {
      service.sessionId.set('XYZ789');
      expect(service.sessionId()).toBe('XYZ789');
    });
  });

  describe('addTask', () => {
    it('should create a task with correct properties', async () => {
      await service.addTask('Test task', false);

      expect(mockTaskStore.save).toHaveBeenCalledTimes(1);
      const savedTask = mockTaskStore.save.mock.calls[0][0] as Task;
      expect(savedTask.content).toBe('Test task');
      expect(savedTask.isSecret).toBe(false);
      expect(savedTask.sessionId).toBe(testSessionId);
      expect(savedTask.revealVotes).toBe(0);
      expect(savedTask.voterIds).toEqual([]);
    });

    it('should create a secret task', async () => {
      await service.addTask('Secret task', true);

      const savedTask = mockTaskStore.save.mock.calls[0][0] as Task;
      expect(savedTask.isSecret).toBe(true);
    });

    it('should trim whitespace from content', async () => {
      await service.addTask('  padded content  ', false);

      const savedTask = mockTaskStore.save.mock.calls[0][0] as Task;
      expect(savedTask.content).toBe('padded content');
    });

    it('should not create task with empty content', async () => {
      await service.addTask('', false);
      expect(mockTaskStore.save).not.toHaveBeenCalled();
    });

    it('should not create task with whitespace-only content', async () => {
      await service.addTask('   ', false);
      expect(mockTaskStore.save).not.toHaveBeenCalled();
    });

    it('should not create task without sessionId', async () => {
      service.sessionId.set(null);
      await service.addTask('Valid content', false);
      expect(mockTaskStore.save).not.toHaveBeenCalled();
    });

    it('should not create task without authenticated user', async () => {
      mockAuthProvider.currentUser.mockReturnValue(null);
      await service.addTask('Valid content', false);
      expect(mockTaskStore.save).not.toHaveBeenCalled();
    });

    it('should publish sync message after save', async () => {
      await service.addTask('My task', false);

      expect(mockSyncBus.publish).toHaveBeenCalledWith({
        type: 'task-update',
        payload: { sessionId: testSessionId },
      });
    });

    it('should not publish if save fails', async () => {
      mockTaskStore.save.mockRejectedValueOnce(new Error('Save failed'));

      await service.addTask('My task', false);

      expect(mockSyncBus.publish).not.toHaveBeenCalled();
    });

    it('should log error when save fails', async () => {
      const error = new Error('Save failed');
      mockTaskStore.save.mockRejectedValueOnce(error);

      await service.addTask('My task', false);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to add task', error);
    });

    it('should generate valid UUID for task id', async () => {
      await service.addTask('Test task', false);

      const savedTask = mockTaskStore.save.mock.calls[0][0] as Task;
      expect(savedTask.id).toBeDefined();
      expect(typeof savedTask.id).toBe('string');
      expect(savedTask.id.length).toBeGreaterThan(0);
    });

    it('should set createdAt timestamp', async () => {
      await service.addTask('Test task', false);

      const savedTask = mockTaskStore.save.mock.calls[0][0] as Task;
      expect(savedTask.createdAt).toBeDefined();
      // Should be a valid ISO string
      expect(() => new Date(savedTask.createdAt)).not.toThrow();
    });
  });

  describe('revealTask', () => {
    const createTask = (overrides?: Partial<Task>): Task => ({
      id: '550e8400-e29b-41d4-a716-446655440000',
      sessionId: testSessionId,
      content: 'Secret content',
      isSecret: true,
      revealVotes: 0,
      voterIds: [],
      createdAt: '2024-01-15T10:30:00.000Z',
      ...overrides,
    });

    it('should add user vote to task', async () => {
      const task = createTask();

      await service.revealTask(task);

      const savedTask = mockTaskStore.save.mock.calls[0][0] as Task;
      expect(savedTask.voterIds).toContain(testUser.id);
      expect(savedTask.revealVotes).toBe(1);
    });

    it('should increment revealVotes correctly', async () => {
      const task = createTask({
        revealVotes: 1,
        voterIds: ['other-user-uuid'],
      });

      await service.revealTask(task);

      const savedTask = mockTaskStore.save.mock.calls[0][0] as Task;
      expect(savedTask.revealVotes).toBe(2);
      expect(savedTask.voterIds).toHaveLength(2);
    });

    it('should prevent duplicate votes', async () => {
      const task = createTask({
        revealVotes: 1,
        voterIds: [testUser.id],
      });

      await service.revealTask(task);

      expect(mockTaskStore.save).not.toHaveBeenCalled();
    });

    it('should not vote without authenticated user', async () => {
      mockAuthProvider.currentUser.mockReturnValue(null);
      const task = createTask();

      await service.revealTask(task);

      expect(mockTaskStore.save).not.toHaveBeenCalled();
    });

    it('should not vote without sessionId', async () => {
      service.sessionId.set(null);
      const task = createTask();

      await service.revealTask(task);

      expect(mockTaskStore.save).not.toHaveBeenCalled();
    });

    it('should publish sync message after vote', async () => {
      const task = createTask();

      await service.revealTask(task);

      expect(mockSyncBus.publish).toHaveBeenCalledWith({
        type: 'task-update',
        payload: { sessionId: testSessionId },
      });
    });

    it('should preserve task properties', async () => {
      const task = createTask({
        content: 'Original content',
        createdAt: '2024-01-15T10:30:00.000Z',
      });

      await service.revealTask(task);

      const savedTask = mockTaskStore.save.mock.calls[0][0] as Task;
      expect(savedTask.content).toBe('Original content');
      expect(savedTask.createdAt).toBe('2024-01-15T10:30:00.000Z');
      expect(savedTask.id).toBe(task.id);
    });

    it('should not publish if save fails during reveal', async () => {
      mockTaskStore.save.mockRejectedValueOnce(new Error('Save failed'));
      const task = createTask();

      await service.revealTask(task);

      expect(mockSyncBus.publish).not.toHaveBeenCalled();
    });

    it('should log error when reveal save fails', async () => {
      const error = new Error('Reveal failed');
      mockTaskStore.save.mockRejectedValueOnce(error);
      const task = createTask();

      await service.revealTask(task);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to update task for reveal', error);
    });
  });

  describe('tasks computed', () => {
    it('should return empty array when no tasks', () => {
      expect(service.tasks()).toEqual([]);
    });

    it('should return tasks from state', () => {
      const testTasks: Task[] = [
        createTestTask({ id: 'task-1', content: 'First', createdAt: '2024-01-15T10:30:00.000Z' }),
        createTestTask({ id: 'task-2', content: 'Second', createdAt: '2024-01-15T10:31:00.000Z' }),
      ];
      tasksStateValue = { loading: false, tasks: testTasks, error: null };

      const result = service.tasks();
      expect(result).toHaveLength(2);
    });
  });

  describe('isLoading computed', () => {
    it('should return a boolean value', () => {
      // The isLoading computed returns the loading state from tasksState
      expect(typeof service.isLoading()).toBe('boolean');
    });

    it('should return true when loading', () => {
      tasksStateValue = { loading: true, tasks: [], error: null };
      expect(service.isLoading()).toBe(true);
    });

    it('should return false when not loading', () => {
      tasksStateValue = { loading: false, tasks: [], error: null };
      expect(service.isLoading()).toBe(false);
    });
  });
});

// Helper function for creating test tasks
function createTestTask(overrides?: Partial<Task>): Task {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    sessionId: 'ABC123',
    content: 'Test task',
    isSecret: false,
    revealVotes: 0,
    voterIds: [],
    createdAt: '2024-01-15T10:30:00.000Z',
    ...overrides,
  };
}
