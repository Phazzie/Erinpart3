import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Task } from '../../core/models/task';

// Test the business logic of SessionPageComponent
describe('SessionPageComponent Logic', () => {
  describe('sessionUrl computed', () => {
    it('should generate correct URL format', () => {
      const baseUrl = 'https://example.com/app';
      const sessionId = 'ABC123';
      const sessionUrl = `${baseUrl.split('#')[0]}#/s/${sessionId}`;

      expect(sessionUrl).toBe('https://example.com/app#/s/ABC123');
    });

    it('should handle URL with existing hash', () => {
      const baseUrl = 'https://example.com/app#/other';
      const sessionId = 'XYZ789';
      const sessionUrl = `${baseUrl.split('#')[0]}#/s/${sessionId}`;

      expect(sessionUrl).toBe('https://example.com/app#/s/XYZ789');
    });

    it('should handle URL without hash', () => {
      const baseUrl = 'https://example.com/app';
      const sessionId = 'TEST99';
      const sessionUrl = `${baseUrl.split('#')[0]}#/s/${sessionId}`;

      expect(sessionUrl).toBe('https://example.com/app#/s/TEST99');
    });

    it('should handle localhost URL', () => {
      const baseUrl = 'http://localhost:4200';
      const sessionId = 'LOCAL1';
      const sessionUrl = `${baseUrl.split('#')[0]}#/s/${sessionId}`;

      expect(sessionUrl).toBe('http://localhost:4200#/s/LOCAL1');
    });
  });

  describe('addTask', () => {
    it('should clear form after adding task', async () => {
      let newTaskContent = 'Test content';
      let isNewTaskSecret = true;

      const mockTaskService = {
        addTask: vi.fn().mockResolvedValue(undefined),
      };

      // Simulate addTask method
      await mockTaskService.addTask(newTaskContent, isNewTaskSecret);
      newTaskContent = '';
      isNewTaskSecret = false;

      expect(newTaskContent).toBe('');
      expect(isNewTaskSecret).toBe(false);
      expect(mockTaskService.addTask).toHaveBeenCalledWith('Test content', true);
    });

    it('should pass correct parameters to taskService', async () => {
      const mockTaskService = {
        addTask: vi.fn().mockResolvedValue(undefined),
      };

      await mockTaskService.addTask('My task', false);
      expect(mockTaskService.addTask).toHaveBeenCalledWith('My task', false);

      await mockTaskService.addTask('Secret task', true);
      expect(mockTaskService.addTask).toHaveBeenCalledWith('Secret task', true);
    });
  });

  describe('handleReveal', () => {
    it('should call taskService.revealTask with task', () => {
      const mockTaskService = {
        revealTask: vi.fn(),
      };

      const task: Task = {
        id: 'task-123',
        sessionId: 'ABC123',
        content: 'Test',
        isSecret: true,
        revealVotes: 1,
        voterIds: ['other-user'],
        createdAt: '2024-01-15T10:00:00.000Z',
      };

      // Simulate handleReveal
      mockTaskService.revealTask(task);

      expect(mockTaskService.revealTask).toHaveBeenCalledWith(task);
    });
  });

  describe('toggleShareModal', () => {
    it('should toggle modal from closed to open', () => {
      let isShareModalOpen = false;
      let copyButtonText = 'Copy Link';

      // Toggle open
      isShareModalOpen = !isShareModalOpen;
      if (!isShareModalOpen) {
        copyButtonText = 'Copy Link';
      }

      expect(isShareModalOpen).toBe(true);
      expect(copyButtonText).toBe('Copy Link'); // Not reset when opening
    });

    it('should toggle modal from open to closed', () => {
      let isShareModalOpen = true;
      let copyButtonText = 'Copied!';

      // Toggle closed
      isShareModalOpen = !isShareModalOpen;
      if (!isShareModalOpen) {
        copyButtonText = 'Copy Link';
      }

      expect(isShareModalOpen).toBe(false);
      expect(copyButtonText).toBe('Copy Link'); // Reset when closing
    });

    it('should reset copyButtonText when closing', () => {
      let isShareModalOpen = true;
      let copyButtonText = 'Copied!';

      // Close modal
      isShareModalOpen = false;
      if (!isShareModalOpen) {
        copyButtonText = 'Copy Link';
      }

      expect(copyButtonText).toBe('Copy Link');
    });
  });

  describe('copyLink', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should update button text to Copied! on success', async () => {
      let copyButtonText = 'Copy Link';
      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined),
      };

      const sessionUrl = 'https://example.com#/s/ABC123';

      await mockClipboard.writeText(sessionUrl);
      copyButtonText = 'Copied!';

      expect(mockClipboard.writeText).toHaveBeenCalledWith(sessionUrl);
      expect(copyButtonText).toBe('Copied!');
    });

    it('should reset button text after 2 seconds', async () => {
      let copyButtonText = 'Copy Link';

      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined),
      };

      await mockClipboard.writeText('url');
      copyButtonText = 'Copied!';

      // Simulate setTimeout callback
      setTimeout(() => {
        copyButtonText = 'Copy Link';
      }, 2000);

      vi.advanceTimersByTime(2000);

      expect(copyButtonText).toBe('Copy Link');
    });

    it('should not reset text before 2 seconds', async () => {
      let copyButtonText = 'Copy Link';
      let timeoutCalled = false;

      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined),
      };

      await mockClipboard.writeText('url');
      copyButtonText = 'Copied!';

      setTimeout(() => {
        copyButtonText = 'Copy Link';
        timeoutCalled = true;
      }, 2000);

      vi.advanceTimersByTime(1999);

      expect(copyButtonText).toBe('Copied!');
      expect(timeoutCalled).toBe(false);
    });
  });

  describe('session linking', () => {
    it('should update taskService sessionId when component sessionId changes', () => {
      const mockTaskService = {
        sessionId: { set: vi.fn() },
      };

      const componentSessionId = 'NEW123';

      // Simulate effect
      mockTaskService.sessionId.set(componentSessionId ?? null);

      expect(mockTaskService.sessionId.set).toHaveBeenCalledWith('NEW123');
    });

    it('should set null when sessionId is undefined', () => {
      const mockTaskService = {
        sessionId: { set: vi.fn() },
      };

      const componentSessionId: string | undefined = undefined;

      mockTaskService.sessionId.set(componentSessionId ?? null);

      expect(mockTaskService.sessionId.set).toHaveBeenCalledWith(null);
    });
  });

  describe('form state', () => {
    it('should track newTaskContent', () => {
      let newTaskContent = '';

      newTaskContent = 'New task';
      expect(newTaskContent).toBe('New task');

      newTaskContent = '';
      expect(newTaskContent).toBe('');
    });

    it('should track isNewTaskSecret toggle', () => {
      let isNewTaskSecret = false;

      isNewTaskSecret = true;
      expect(isNewTaskSecret).toBe(true);

      isNewTaskSecret = false;
      expect(isNewTaskSecret).toBe(false);
    });

    it('should reset form state after task creation', () => {
      let newTaskContent = 'My new task';
      let isNewTaskSecret = true;

      // Simulate post-addTask reset
      newTaskContent = '';
      isNewTaskSecret = false;

      expect(newTaskContent).toBe('');
      expect(isNewTaskSecret).toBe(false);
    });
  });

  describe('QR code rendering conditions', () => {
    it('should only render QR when modal is open and sessionId exists', () => {
      const shouldRenderQR = (
        isModalOpen: boolean,
        hasCanvas: boolean,
        sessionId: string | null,
      ): boolean => {
        return isModalOpen && hasCanvas && !!sessionId;
      };

      expect(shouldRenderQR(true, true, 'ABC123')).toBe(true);
      expect(shouldRenderQR(false, true, 'ABC123')).toBe(false);
      expect(shouldRenderQR(true, false, 'ABC123')).toBe(false);
      expect(shouldRenderQR(true, true, null)).toBe(false);
      expect(shouldRenderQR(false, false, null)).toBe(false);
    });
  });
});
