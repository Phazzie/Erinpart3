import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageProvider } from './local-storage.provider';

describe('LocalStorageProvider', () => {
  let provider: LocalStorageProvider;

  beforeEach(() => {
    // localStorage is mocked globally in test-setup.ts
    localStorage.clear();
    provider = new LocalStorageProvider();
  });

  it('should get item from localStorage', () => {
    localStorage.setItem('testKey', 'testValue');
    expect(provider.getItem('testKey')).toBe('testValue');
  });

  it('should return null for non-existent key', () => {
    expect(provider.getItem('nonExistent')).toBeNull();
  });

  it('should set item in localStorage', () => {
    provider.setItem('newKey', 'newValue');
    expect(localStorage.getItem('newKey')).toBe('newValue');
  });

  it('should remove item from localStorage', () => {
    localStorage.setItem('toDelete', 'value');
    provider.removeItem('toDelete');
    expect(localStorage.getItem('toDelete')).toBeNull();
  });

  it('should handle multiple operations', () => {
    provider.setItem('key1', 'value1');
    provider.setItem('key2', 'value2');

    expect(provider.getItem('key1')).toBe('value1');
    expect(provider.getItem('key2')).toBe('value2');

    provider.removeItem('key1');
    expect(provider.getItem('key1')).toBeNull();
    expect(provider.getItem('key2')).toBe('value2');
  });
});
