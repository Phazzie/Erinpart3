import { describe, it, expect, beforeEach } from 'vitest';
import { GuestAuthProvider } from './guest-auth.provider';

const GUEST_USER_KEY = 'erins-escapades-guest-user';

describe('GuestAuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should create new guest user when no user exists in localStorage', () => {
      const provider = new GuestAuthProvider();

      const user = provider.currentUser();
      expect(user).not.toBeNull();
      expect(user?.name).toBe('Guest');
      expect(user?.id).toBeTruthy();
    });

    it('should restore existing user from localStorage', () => {
      const existingUser = { id: 'existing-uuid-123', name: 'Guest' };
      localStorage.setItem(GUEST_USER_KEY, JSON.stringify(existingUser));

      const provider = new GuestAuthProvider();

      const user = provider.currentUser();
      expect(user).toEqual(existingUser);
    });

    it('should preserve user ID across provider instances', () => {
      const provider1 = new GuestAuthProvider();
      const user1 = provider1.currentUser();

      const provider2 = new GuestAuthProvider();
      const user2 = provider2.currentUser();

      expect(user1?.id).toBe(user2?.id);
    });

    it('should generate unique ID for new users', () => {
      const provider = new GuestAuthProvider();

      const user = provider.currentUser();
      expect(typeof user?.id).toBe('string');
      expect(user?.id.length).toBeGreaterThan(0);
    });

    it('should set name as Guest for new users', () => {
      const provider = new GuestAuthProvider();

      const user = provider.currentUser();
      expect(user?.name).toBe('Guest');
    });
  });

  describe('localStorage handling', () => {
    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem(GUEST_USER_KEY, 'not-valid-json');

      const provider = new GuestAuthProvider();

      const user = provider.currentUser();
      expect(user).not.toBeNull();
      expect(user?.name).toBe('Guest');
    });

    it('should persist user data to localStorage', () => {
      const provider = new GuestAuthProvider();

      const stored = localStorage.getItem(GUEST_USER_KEY);
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.name).toBe('Guest');
      expect(parsed.id).toBeTruthy();
    });
  });

  describe('initialize method', () => {
    it('should be callable multiple times without error', () => {
      const provider = new GuestAuthProvider();
      expect(() => provider.initialize()).not.toThrow();

      const user = provider.currentUser();
      expect(user).not.toBeNull();
    });
  });

  describe('signal reactivity', () => {
    it('should provide currentUser as a signal', () => {
      const provider = new GuestAuthProvider();

      // Signal should be callable
      const user = provider.currentUser();
      expect(user).not.toBeNull();
    });

    it('should allow setting currentUser via signal', () => {
      const provider = new GuestAuthProvider();

      const newUser = { id: 'new-user-id', name: 'New User' };
      provider.currentUser.set(newUser);

      expect(provider.currentUser()).toEqual(newUser);
    });
  });
});
