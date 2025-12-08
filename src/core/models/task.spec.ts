import { describe, it, expect } from 'vitest';
import { TaskSchema, Task } from './task';
import { z } from 'zod';

describe('TaskSchema', () => {
  const validTask: Task = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    sessionId: 'ABC123',
    content: 'Test task content',
    isSecret: false,
    revealVotes: 0,
    voterIds: [],
    createdAt: '2024-01-15T10:30:00.000Z',
  };

  describe('valid tasks', () => {
    it('should accept a valid non-secret task', () => {
      const result = TaskSchema.safeParse(validTask);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validTask);
      }
    });

    it('should accept a valid secret task with votes', () => {
      const secretTask: Task = {
        ...validTask,
        isSecret: true,
        revealVotes: 2,
        voterIds: [
          '550e8400-e29b-41d4-a716-446655440001',
          '550e8400-e29b-41d4-a716-446655440002',
        ],
      };
      const result = TaskSchema.safeParse(secretTask);
      expect(result.success).toBe(true);
    });

    it('should accept content at max length (200 chars)', () => {
      const maxContentTask: Task = {
        ...validTask,
        content: 'a'.repeat(200),
      };
      const result = TaskSchema.safeParse(maxContentTask);
      expect(result.success).toBe(true);
    });

    it('should accept sessionId with only numbers', () => {
      const numericSessionTask: Task = {
        ...validTask,
        sessionId: '123456',
      };
      const result = TaskSchema.safeParse(numericSessionTask);
      expect(result.success).toBe(true);
    });

    it('should accept sessionId with only letters', () => {
      const letterSessionTask: Task = {
        ...validTask,
        sessionId: 'ABCDEF',
      };
      const result = TaskSchema.safeParse(letterSessionTask);
      expect(result.success).toBe(true);
    });
  });

  describe('id validation', () => {
    it('should reject non-UUID id', () => {
      const invalidTask = { ...validTask, id: 'not-a-uuid' };
      const result = TaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('should reject empty id', () => {
      const invalidTask = { ...validTask, id: '' };
      const result = TaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('should reject missing id', () => {
      const { id, ...taskWithoutId } = validTask;
      const result = TaskSchema.safeParse(taskWithoutId);
      expect(result.success).toBe(false);
    });
  });

  describe('sessionId validation', () => {
    it('should reject sessionId shorter than 6 characters', () => {
      const invalidTask = { ...validTask, sessionId: 'ABC12' };
      const result = TaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('should reject sessionId longer than 6 characters', () => {
      const invalidTask = { ...validTask, sessionId: 'ABC1234' };
      const result = TaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('should reject sessionId with lowercase letters', () => {
      const invalidTask = { ...validTask, sessionId: 'abc123' };
      const result = TaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('should reject sessionId with special characters', () => {
      const invalidTask = { ...validTask, sessionId: 'ABC12!' };
      const result = TaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('should reject empty sessionId', () => {
      const invalidTask = { ...validTask, sessionId: '' };
      const result = TaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });
  });

  describe('content validation', () => {
    it('should reject empty content', () => {
      const invalidTask = { ...validTask, content: '' };
      const result = TaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('should reject content longer than 200 characters', () => {
      const invalidTask = { ...validTask, content: 'a'.repeat(201) };
      const result = TaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('should accept single character content', () => {
      const minContentTask: Task = { ...validTask, content: 'a' };
      const result = TaskSchema.safeParse(minContentTask);
      expect(result.success).toBe(true);
    });
  });

  describe('isSecret validation', () => {
    it('should reject non-boolean isSecret', () => {
      const invalidTask = { ...validTask, isSecret: 'true' };
      const result = TaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('should reject missing isSecret', () => {
      const { isSecret, ...taskWithoutSecret } = validTask;
      const result = TaskSchema.safeParse(taskWithoutSecret);
      expect(result.success).toBe(false);
    });
  });

  describe('revealVotes validation', () => {
    it('should reject negative revealVotes', () => {
      const invalidTask = { ...validTask, revealVotes: -1 };
      const result = TaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer revealVotes', () => {
      const invalidTask = { ...validTask, revealVotes: 1.5 };
      const result = TaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('should accept zero revealVotes', () => {
      const result = TaskSchema.safeParse(validTask);
      expect(result.success).toBe(true);
    });

    it('should accept positive integer revealVotes', () => {
      const taskWithVotes: Task = { ...validTask, revealVotes: 10 };
      const result = TaskSchema.safeParse(taskWithVotes);
      expect(result.success).toBe(true);
    });
  });

  describe('voterIds validation', () => {
    it('should reject non-UUID voterIds', () => {
      const invalidTask = { ...validTask, voterIds: ['not-a-uuid'] };
      const result = TaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('should reject mixed valid/invalid voterIds', () => {
      const invalidTask = {
        ...validTask,
        voterIds: ['550e8400-e29b-41d4-a716-446655440001', 'invalid'],
      };
      const result = TaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('should accept empty voterIds array', () => {
      const result = TaskSchema.safeParse(validTask);
      expect(result.success).toBe(true);
    });

    it('should accept multiple valid UUID voterIds', () => {
      const taskWithVoters: Task = {
        ...validTask,
        voterIds: [
          '550e8400-e29b-41d4-a716-446655440001',
          '550e8400-e29b-41d4-a716-446655440002',
          '550e8400-e29b-41d4-a716-446655440003',
        ],
      };
      const result = TaskSchema.safeParse(taskWithVoters);
      expect(result.success).toBe(true);
    });
  });

  describe('createdAt validation', () => {
    it('should reject invalid date string', () => {
      const invalidTask = { ...validTask, createdAt: 'not-a-date' };
      const result = TaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('should reject date without timezone', () => {
      const invalidTask = { ...validTask, createdAt: '2024-01-15T10:30:00' };
      const result = TaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('should accept ISO date with Z timezone', () => {
      const taskWithZ: Task = { ...validTask, createdAt: '2024-01-15T10:30:00Z' };
      const result = TaskSchema.safeParse(taskWithZ);
      expect(result.success).toBe(true);
    });

    it('should accept ISO date with offset timezone', () => {
      const taskWithOffset: Task = {
        ...validTask,
        createdAt: '2024-01-15T10:30:00+05:30',
      };
      const result = TaskSchema.safeParse(taskWithOffset);
      expect(result.success).toBe(true);
    });
  });

  describe('type inference', () => {
    it('should correctly infer Task type from schema', () => {
      const parsed = TaskSchema.parse(validTask);
      // TypeScript should allow this assignment without errors
      const task: Task = parsed;
      expect(task.id).toBe(validTask.id);
      expect(task.sessionId).toBe(validTask.sessionId);
      expect(task.content).toBe(validTask.content);
      expect(task.isSecret).toBe(validTask.isSecret);
      expect(task.revealVotes).toBe(validTask.revealVotes);
      expect(task.voterIds).toEqual(validTask.voterIds);
      expect(task.createdAt).toBe(validTask.createdAt);
    });
  });
});
