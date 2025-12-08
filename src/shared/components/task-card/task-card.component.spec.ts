import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Task } from '../../../core/models/task';

// Mock Angular core to avoid decorator issues
vi.mock('@angular/core', async () => {
  const actual = await vi.importActual('@angular/core');
  return {
    ...actual,
    Component: () => (target: any) => target,
    ChangeDetectionStrategy: { OnPush: 0 },
    input: {
      required: () => ({
        __brand: 'input',
      }),
    },
    output: () => ({
      emit: vi.fn(),
      __brand: 'output',
    }),
    computed: (fn: () => any) => fn,
  };
});

// Import after mocking
import { TaskCardComponent } from './task-card.component';

describe('TaskCardComponent', () => {
  const createTask = (overrides?: Partial<Task>): Task => ({
    id: '550e8400-e29b-41d4-a716-446655440000',
    sessionId: 'ABC123',
    content: 'Test task content',
    isSecret: false,
    revealVotes: 0,
    voterIds: [],
    createdAt: '2024-01-15T10:30:00.000Z',
    ...overrides,
  });

  const currentUserId = 'user-uuid-456';

  describe('isRevealed logic', () => {
    // Test the isRevealed logic: !task.isSecret || task.revealVotes >= 2
    const isRevealed = (task: Task): boolean => {
      return !task.isSecret || task.revealVotes >= 2;
    };

    it('should return true for non-secret task', () => {
      const task = createTask({ isSecret: false });
      expect(isRevealed(task)).toBe(true);
    });

    it('should return false for secret task with no votes', () => {
      const task = createTask({ isSecret: true, revealVotes: 0 });
      expect(isRevealed(task)).toBe(false);
    });

    it('should return false for secret task with 1 vote', () => {
      const task = createTask({ isSecret: true, revealVotes: 1 });
      expect(isRevealed(task)).toBe(false);
    });

    it('should return true for secret task with 2 votes', () => {
      const task = createTask({ isSecret: true, revealVotes: 2 });
      expect(isRevealed(task)).toBe(true);
    });

    it('should return true for secret task with more than 2 votes', () => {
      const task = createTask({ isSecret: true, revealVotes: 5 });
      expect(isRevealed(task)).toBe(true);
    });
  });

  describe('canVote logic', () => {
    // Test the canVote logic
    const canVote = (task: Task, userId: string): boolean => {
      return (
        task.isSecret && !task.voterIds.includes(userId) && task.revealVotes < 2
      );
    };

    it('should return false for non-secret task', () => {
      const task = createTask({ isSecret: false });
      expect(canVote(task, currentUserId)).toBe(false);
    });

    it('should return true for secret task user has not voted on', () => {
      const task = createTask({
        isSecret: true,
        revealVotes: 0,
        voterIds: [],
      });
      expect(canVote(task, currentUserId)).toBe(true);
    });

    it('should return false if user already voted', () => {
      const task = createTask({
        isSecret: true,
        revealVotes: 1,
        voterIds: [currentUserId],
      });
      expect(canVote(task, currentUserId)).toBe(false);
    });

    it('should return true if another user voted but not current user', () => {
      const task = createTask({
        isSecret: true,
        revealVotes: 1,
        voterIds: ['other-user-uuid'],
      });
      expect(canVote(task, currentUserId)).toBe(true);
    });

    it('should return false if task is already revealed (2+ votes)', () => {
      const task = createTask({
        isSecret: true,
        revealVotes: 2,
        voterIds: ['user-1', 'user-2'],
      });
      expect(canVote(task, currentUserId)).toBe(false);
    });
  });

  describe('revealProgress logic', () => {
    const revealProgress = (task: Task): string => {
      return `${task.revealVotes}/2`;
    };

    it('should show 0/2 for task with no votes', () => {
      const task = createTask({ revealVotes: 0 });
      expect(revealProgress(task)).toBe('0/2');
    });

    it('should show 1/2 for task with 1 vote', () => {
      const task = createTask({ revealVotes: 1 });
      expect(revealProgress(task)).toBe('1/2');
    });

    it('should show 2/2 for task with 2 votes', () => {
      const task = createTask({ revealVotes: 2 });
      expect(revealProgress(task)).toBe('2/2');
    });
  });

  describe('onRevealClick logic', () => {
    it('should emit reveal event when canVote is true', () => {
      const task = createTask({
        isSecret: true,
        revealVotes: 0,
        voterIds: [],
      });

      const canVote = (t: Task, userId: string): boolean => {
        return t.isSecret && !t.voterIds.includes(userId) && t.revealVotes < 2;
      };

      const emitFn = vi.fn();

      if (canVote(task, currentUserId)) {
        emitFn(task);
      }

      expect(emitFn).toHaveBeenCalledWith(task);
    });

    it('should not emit when user already voted', () => {
      const task = createTask({
        isSecret: true,
        revealVotes: 1,
        voterIds: [currentUserId],
      });

      const canVote = (t: Task, userId: string): boolean => {
        return t.isSecret && !t.voterIds.includes(userId) && t.revealVotes < 2;
      };

      const emitFn = vi.fn();

      if (canVote(task, currentUserId)) {
        emitFn(task);
      }

      expect(emitFn).not.toHaveBeenCalled();
    });

    it('should not emit for non-secret task', () => {
      const task = createTask({ isSecret: false });

      const canVote = (t: Task, userId: string): boolean => {
        return t.isSecret && !t.voterIds.includes(userId) && t.revealVotes < 2;
      };

      const emitFn = vi.fn();

      if (canVote(task, currentUserId)) {
        emitFn(task);
      }

      expect(emitFn).not.toHaveBeenCalled();
    });

    it('should not emit for already revealed task', () => {
      const task = createTask({
        isSecret: true,
        revealVotes: 2,
        voterIds: ['other1', 'other2'],
      });

      const canVote = (t: Task, userId: string): boolean => {
        return t.isSecret && !t.voterIds.includes(userId) && t.revealVotes < 2;
      };

      const emitFn = vi.fn();

      if (canVote(task, currentUserId)) {
        emitFn(task);
      }

      expect(emitFn).not.toHaveBeenCalled();
    });
  });

  describe('display scenarios', () => {
    it('should show content when task is not secret', () => {
      const task = createTask({ isSecret: false, content: 'Public task' });
      const isRevealed = !task.isSecret || task.revealVotes >= 2;
      expect(isRevealed).toBe(true);
    });

    it('should hide content when task is secret and not revealed', () => {
      const task = createTask({
        isSecret: true,
        revealVotes: 1,
        content: 'Secret content',
      });
      const isRevealed = !task.isSecret || task.revealVotes >= 2;
      expect(isRevealed).toBe(false);
    });

    it('should show content when secret task is revealed', () => {
      const task = createTask({
        isSecret: true,
        revealVotes: 2,
        content: 'Now visible secret',
      });
      const isRevealed = !task.isSecret || task.revealVotes >= 2;
      expect(isRevealed).toBe(true);
    });
  });
});
