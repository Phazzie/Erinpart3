import { describe, it, expect, beforeEach, vi } from 'vitest';

const GUEST_USER_KEY = 'erins-escapades-guest-user';

// Mock storage
const mockStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

// Mock logger
const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock Angular inject
vi.mock('@angular/core', async () => {
  const actual = await vi.importActual('@angular/core');
  return {
    ...actual,
    inject: vi.fn((token: any) => {
      const tokenName = token?.name || token?.toString() || '';
      if (tokenName.includes('StorageProvider')) return mockStorage;
      if (tokenName.includes('LoggerService')) return mockLogger;
      return null;
    }),
  };
});

import { GuestAuthProvider } from './guest-auth.provider';

describe('GuestAuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.getItem.mockReturnValue(null);
  });

  describe('initialization', () => {
    it('should create new guest user when no user exists in storage', () => {
      mockStorage.getItem.mockReturnValue(null);
      const provider = new GuestAuthProvider();

      const user = provider.currentUser();
      expect(user).not.toBeNull();
      expect(user?.name).toBe('Guest');
      expect(user?.id).toBeTruthy();
    });

    it('should restore existing user from storage', () => {
      const existingUser = { id: 'existing-uuid-123', name: 'Guest' };
      mockStorage.getItem.mockReturnValue(JSON.stringify(existingUser));

      const provider = new GuestAuthProvider();

      const user = provider.currentUser();
      expect(user).toEqual(existingUser);
    });

    it('should preserve user ID across provider instances', () => {
      const existingUser = { id: 'persistent-uuid', name: 'Guest' };
      mockStorage.getItem.mockReturnValue(JSON.stringify(existingUser));

      const provider1 = new GuestAuthProvider();
      const user1 = provider1.currentUser();

      const provider2 = new GuestAuthProvider();
      const user2 = provider2.currentUser();

      expect(user1?.id).toBe(user2?.id);
    });

    it('should generate unique ID for new users', () => {
      mockStorage.getItem.mockReturnValue(null);
      const provider = new GuestAuthProvider();

      const user = provider.currentUser();
      expect(typeof user?.id).toBe('string');
      expect(user?.id.length).toBeGreaterThan(0);
    });

    it('should set name as Guest for new users', () => {
      mockStorage.getItem.mockReturnValue(null);
      const provider = new GuestAuthProvider();

      const user = provider.currentUser();
      expect(user?.name).toBe('Guest');
    });
  });

  describe('storage handling', () => {
    it('should handle corrupted storage data gracefully', () => {
      mockStorage.getItem.mockReturnValue('not-valid-json');

      const provider = new GuestAuthProvider();

      const user = provider.currentUser();
      expect(user).not.toBeNull();
      expect(user?.name).toBe('Guest');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should persist user data to storage', () => {
      mockStorage.getItem.mockReturnValue(null);
      const provider = new GuestAuthProvider();

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        GUEST_USER_KEY,
        expect.stringContaining('"name":"Guest"')
      );
    });

    it('should handle structurally invalid user data from storage', () => {
      // Valid JSON but missing required fields
      const invalidUser = { id: 123, name: null };
      mockStorage.getItem.mockReturnValue(JSON.stringify(invalidUser));

      const provider = new GuestAuthProvider();
      const user = provider.currentUser();

      // Should create new user since structure is invalid
      expect(user).not.toBeNull();
      expect(user?.name).toBe('Guest');
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should handle empty object in storage', () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify({}));

      const provider = new GuestAuthProvider();
      const user = provider.currentUser();

      // Should create new user since structure is invalid
      expect(user).not.toBeNull();
      expect(user?.name).toBe('Guest');
    });
  });

  describe('initialize method', () => {
    it('should be callable multiple times without error', () => {
      mockStorage.getItem.mockReturnValue(null);
      const provider = new GuestAuthProvider();
      expect(() => provider.initialize()).not.toThrow();

      const user = provider.currentUser();
      expect(user).not.toBeNull();
    });
  });

  describe('signal reactivity', () => {
    it('should provide currentUser as a signal', () => {
      mockStorage.getItem.mockReturnValue(null);
      const provider = new GuestAuthProvider();

      // Signal should be callable
      const user = provider.currentUser();
      expect(user).not.toBeNull();
    });

    it('should allow setting currentUser via signal', () => {
      mockStorage.getItem.mockReturnValue(null);
      const provider = new GuestAuthProvider();

      const newUser = { id: 'new-user-id', name: 'New User' };
      provider.currentUser.set(newUser);

      expect(provider.currentUser()).toEqual(newUser);
    });
  });
});
