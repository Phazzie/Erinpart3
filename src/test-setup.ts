import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { vi } from 'vitest';

// Mock crypto.randomUUID for consistent test IDs
let uuidCounter = 0;
vi.stubGlobal('crypto', {
  randomUUID: () => `test-uuid-${++uuidCounter}`,
});

// Reset UUID counter before each test
beforeEach(() => {
  uuidCounter = 0;
});

// Mock BroadcastChannel
class MockBroadcastChannel {
  name: string;
  private listeners: Map<string, Set<(event: MessageEvent) => void>> = new Map();
  private static channels: Map<string, Set<MockBroadcastChannel>> = new Map();

  constructor(name: string) {
    this.name = name;
    if (!MockBroadcastChannel.channels.has(name)) {
      MockBroadcastChannel.channels.set(name, new Set());
    }
    MockBroadcastChannel.channels.get(name)!.add(this);
  }

  postMessage(data: unknown) {
    const event = new MessageEvent('message', { data });
    MockBroadcastChannel.channels.get(this.name)?.forEach(channel => {
      if (channel !== this) {
        channel.listeners.get('message')?.forEach(listener => listener(event));
      }
    });
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: (event: MessageEvent) => void) {
    this.listeners.get(type)?.delete(listener);
  }

  close() {
    MockBroadcastChannel.channels.get(this.name)?.delete(this);
    this.listeners.clear();
  }

  static reset() {
    MockBroadcastChannel.channels.clear();
  }
}

vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);

// Reset BroadcastChannel between tests
afterEach(() => {
  MockBroadcastChannel.reset();
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

vi.stubGlobal('localStorage', localStorageMock);

// Clear localStorage between tests
beforeEach(() => {
  localStorage.clear();
});
