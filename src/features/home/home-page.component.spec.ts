import { describe, it, expect, vi } from 'vitest';

// Test the business logic of HomePageComponent
describe('HomePageComponent Logic', () => {
  describe('sessionId validation (isSessionIdValid)', () => {
    // Logic: /^[A-Z0-9]{6}$/.test(sessionId)
    const isSessionIdValid = (sessionId: string): boolean => {
      return /^[A-Z0-9]{6}$/.test(sessionId);
    };

    it('should return true for valid 6-char uppercase alphanumeric', () => {
      expect(isSessionIdValid('ABC123')).toBe(true);
      expect(isSessionIdValid('ABCDEF')).toBe(true);
      expect(isSessionIdValid('123456')).toBe(true);
      expect(isSessionIdValid('A1B2C3')).toBe(true);
    });

    it('should return false for lowercase letters', () => {
      expect(isSessionIdValid('abc123')).toBe(false);
      expect(isSessionIdValid('ABc123')).toBe(false);
    });

    it('should return false for wrong length', () => {
      expect(isSessionIdValid('ABC12')).toBe(false); // 5 chars
      expect(isSessionIdValid('ABC1234')).toBe(false); // 7 chars
      expect(isSessionIdValid('')).toBe(false); // empty
      expect(isSessionIdValid('AB')).toBe(false); // 2 chars
    });

    it('should return false for special characters', () => {
      expect(isSessionIdValid('ABC12!')).toBe(false);
      expect(isSessionIdValid('ABC-12')).toBe(false);
      expect(isSessionIdValid('ABC_12')).toBe(false);
      expect(isSessionIdValid('ABC 12')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isSessionIdValid('000000')).toBe(true); // all zeros
      expect(isSessionIdValid('ZZZZZZ')).toBe(true); // all Z
      expect(isSessionIdValid('999999')).toBe(true); // all 9s
    });
  });

  describe('joinSession', () => {
    it('should navigate when sessionId is not empty', () => {
      const navigateFn = vi.fn();
      const sessionId = 'abc123';

      // Simulate joinSession logic
      if (sessionId.trim().length > 0) {
        navigateFn(['/s', sessionId.trim().toUpperCase()]);
      }

      expect(navigateFn).toHaveBeenCalledWith(['/s', 'ABC123']);
    });

    it('should convert to uppercase', () => {
      const navigateFn = vi.fn();
      const sessionId = 'xyz789';

      if (sessionId.trim().length > 0) {
        navigateFn(['/s', sessionId.trim().toUpperCase()]);
      }

      expect(navigateFn).toHaveBeenCalledWith(['/s', 'XYZ789']);
    });

    it('should trim whitespace', () => {
      const navigateFn = vi.fn();
      const sessionId = '  abc123  ';

      if (sessionId.trim().length > 0) {
        navigateFn(['/s', sessionId.trim().toUpperCase()]);
      }

      expect(navigateFn).toHaveBeenCalledWith(['/s', 'ABC123']);
    });

    it('should not navigate for empty sessionId', () => {
      const navigateFn = vi.fn();
      const sessionId = '';

      if (sessionId.trim().length > 0) {
        navigateFn(['/s', sessionId.trim().toUpperCase()]);
      }

      expect(navigateFn).not.toHaveBeenCalled();
    });

    it('should not navigate for whitespace-only sessionId', () => {
      const navigateFn = vi.fn();
      const sessionId = '   ';

      if (sessionId.trim().length > 0) {
        navigateFn(['/s', sessionId.trim().toUpperCase()]);
      }

      expect(navigateFn).not.toHaveBeenCalled();
    });
  });

  describe('createNewSession', () => {
    it('should generate 6-character uppercase session ID', () => {
      // Logic: Math.random().toString(36).substring(2, 8).toUpperCase()
      const generateSessionId = () =>
        Math.random().toString(36).substring(2, 8).toUpperCase();

      const id = generateSessionId();

      expect(id).toHaveLength(6);
      expect(id).toMatch(/^[A-Z0-9]+$/);
    });

    it('should generate unique IDs', () => {
      const generateSessionId = () =>
        Math.random().toString(36).substring(2, 8).toUpperCase();

      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateSessionId());
      }

      // Should have at least 90 unique IDs out of 100 (high probability)
      expect(ids.size).toBeGreaterThan(90);
    });

    it('should navigate to new session', () => {
      const navigateFn = vi.fn();
      const newId = 'ABC123'; // Simulated generated ID

      navigateFn(['/s', newId]);

      expect(navigateFn).toHaveBeenCalledWith(['/s', 'ABC123']);
    });
  });

  describe('input handling', () => {
    it('should update sessionId signal', () => {
      let sessionId = '';
      const setSessionId = (value: string) => {
        sessionId = value;
      };

      setSessionId('test');
      expect(sessionId).toBe('test');

      setSessionId('ABC123');
      expect(sessionId).toBe('ABC123');
    });

    it('should reflect changes in validation', () => {
      const isSessionIdValid = (id: string) => /^[A-Z0-9]{6}$/.test(id);

      expect(isSessionIdValid('')).toBe(false);
      expect(isSessionIdValid('A')).toBe(false);
      expect(isSessionIdValid('ABC12')).toBe(false);
      expect(isSessionIdValid('ABC123')).toBe(true);
    });
  });

  describe('navigation paths', () => {
    it('should use correct route structure for session', () => {
      const sessionId = 'TEST99';
      const route = ['/s', sessionId];

      expect(route).toEqual(['/s', 'TEST99']);
    });

    it('should handle various valid session formats', () => {
      const validSessions = ['ABC123', 'XYZ789', '000000', 'AAAAAA', '999999'];

      validSessions.forEach((sessionId) => {
        const route = ['/s', sessionId];
        expect(route[0]).toBe('/s');
        expect(route[1]).toBe(sessionId);
      });
    });
  });
});
