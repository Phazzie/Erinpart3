import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocalStorageProvider } from './local-storage.provider';

describe('LocalStorageProvider', () => {
  let provider: LocalStorageProvider;
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {};

    // Mock localStorage
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
    });

    provider = new LocalStorageProvider();
  });

  it('should get item from localStorage', () => {
    mockStorage['testKey'] = 'testValue';
    expect(provider.getItem('testKey')).toBe('testValue');
  });

  it('should return null for non-existent key', () => {
    expect(provider.getItem('nonExistent')).toBeNull();
  });

  it('should set item in localStorage', () => {
    provider.setItem('newKey', 'newValue');
    expect(mockStorage['newKey']).toBe('newValue');
  });

  it('should remove item from localStorage', () => {
    mockStorage['toDelete'] = 'value';
    provider.removeItem('toDelete');
    expect(mockStorage['toDelete']).toBeUndefined();
  });

  it('should handle localStorage errors gracefully on getItem', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => {
        throw new Error('Storage error');
      }),
    });

    const errorProvider = new LocalStorageProvider();
    expect(errorProvider.getItem('any')).toBeNull();
  });
});
