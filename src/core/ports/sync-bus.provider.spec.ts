import { describe, it, expect, vi } from 'vitest';
import { Observable, of, Subject } from 'rxjs';

// Define SyncMessage interface locally for testing
interface SyncMessage {
  type: 'task-update';
  payload: {
    sessionId: string;
  };
}

// Test the SyncBus interface contract
describe('SyncBus Interface Contract', () => {
  // Mock implementation that follows the interface
  const createMockSyncBus = () => {
    const subjects = new Map<string, Subject<SyncMessage>>();

    return {
      publish: vi.fn((message: SyncMessage) => {
        const subject = subjects.get(message.payload.sessionId);
        if (subject) {
          subject.next(message);
        }
      }),
      subscribe: vi.fn((channel: string): Observable<SyncMessage> => {
        if (!subjects.has(channel)) {
          subjects.set(channel, new Subject<SyncMessage>());
        }
        return subjects.get(channel)!.asObservable();
      }),
      _getSubject: (channel: string) => subjects.get(channel),
    };
  };

  describe('SyncMessage interface', () => {
    it('should have type property set to task-update', () => {
      const message: SyncMessage = {
        type: 'task-update',
        payload: { sessionId: 'ABC123' },
      };

      expect(message.type).toBe('task-update');
    });

    it('should have payload with sessionId', () => {
      const message: SyncMessage = {
        type: 'task-update',
        payload: { sessionId: 'XYZ789' },
      };

      expect(message.payload.sessionId).toBe('XYZ789');
    });

    it('should support various sessionId formats', () => {
      const messages: SyncMessage[] = [
        { type: 'task-update', payload: { sessionId: 'ABC123' } },
        { type: 'task-update', payload: { sessionId: '000000' } },
        { type: 'task-update', payload: { sessionId: 'ZZZZZZ' } },
      ];

      messages.forEach((msg) => {
        expect(msg.payload.sessionId).toMatch(/^[A-Z0-9]{6}$/);
      });
    });
  });

  describe('publish method', () => {
    it('should accept SyncMessage parameter', () => {
      const bus = createMockSyncBus();
      const message: SyncMessage = {
        type: 'task-update',
        payload: { sessionId: 'ABC123' },
      };

      bus.publish(message);

      expect(bus.publish).toHaveBeenCalledWith(message);
    });

    it('should not throw on publish', () => {
      const bus = createMockSyncBus();
      const message: SyncMessage = {
        type: 'task-update',
        payload: { sessionId: 'ABC123' },
      };

      expect(() => bus.publish(message)).not.toThrow();
    });

    it('should be fire-and-forget (void return)', () => {
      const bus = createMockSyncBus();
      const message: SyncMessage = {
        type: 'task-update',
        payload: { sessionId: 'ABC123' },
      };

      const result = bus.publish(message);

      expect(result).toBeUndefined();
    });
  });

  describe('subscribe method', () => {
    it('should accept channel parameter', () => {
      const bus = createMockSyncBus();

      bus.subscribe('ABC123');

      expect(bus.subscribe).toHaveBeenCalledWith('ABC123');
    });

    it('should return Observable<SyncMessage>', () => {
      const bus = createMockSyncBus();

      const result = bus.subscribe('ABC123');

      expect(result).toHaveProperty('subscribe');
      expect(typeof result.subscribe).toBe('function');
    });

    it('should emit messages for the subscribed channel', () => {
      const bus = createMockSyncBus();
      const message: SyncMessage = {
        type: 'task-update',
        payload: { sessionId: 'ABC123' },
      };

      const received: SyncMessage[] = [];
      const subscription = bus.subscribe('ABC123').subscribe((msg) => {
        received.push(msg);
      });

      // Trigger message after subscription
      bus._getSubject('ABC123')?.next(message);

      expect(received).toHaveLength(1);
      expect(received[0]).toEqual(message);

      subscription.unsubscribe();
    });

    it('should support multiple subscribers', () => {
      const bus = createMockSyncBus();
      const received1: SyncMessage[] = [];
      const received2: SyncMessage[] = [];

      bus.subscribe('ABC123').subscribe((msg) => received1.push(msg));
      bus.subscribe('ABC123').subscribe((msg) => received2.push(msg));

      const message: SyncMessage = {
        type: 'task-update',
        payload: { sessionId: 'ABC123' },
      };
      bus._getSubject('ABC123')?.next(message);

      expect(received1).toHaveLength(1);
      expect(received2).toHaveLength(1);
    });
  });

  describe('channel isolation', () => {
    it('should isolate messages by channel', () => {
      const bus = createMockSyncBus();
      const receivedABC: SyncMessage[] = [];
      const receivedXYZ: SyncMessage[] = [];

      bus.subscribe('ABC123').subscribe((msg) => receivedABC.push(msg));
      bus.subscribe('XYZ789').subscribe((msg) => receivedXYZ.push(msg));

      const messageABC: SyncMessage = {
        type: 'task-update',
        payload: { sessionId: 'ABC123' },
      };
      bus._getSubject('ABC123')?.next(messageABC);

      expect(receivedABC).toHaveLength(1);
      expect(receivedXYZ).toHaveLength(0);
    });
  });

  describe('pub/sub pattern', () => {
    it('should deliver published messages to subscribers', () => {
      const bus = createMockSyncBus();
      const received: SyncMessage[] = [];

      // First subscribe
      bus.subscribe('TEST01').subscribe((msg) => received.push(msg));

      // Then publish (via internal subject for this mock)
      const message: SyncMessage = {
        type: 'task-update',
        payload: { sessionId: 'TEST01' },
      };
      bus._getSubject('TEST01')?.next(message);

      expect(received).toContainEqual(message);
    });

    it('should handle rapid message publishing', () => {
      const bus = createMockSyncBus();
      const received: SyncMessage[] = [];

      bus.subscribe('RAPID1').subscribe((msg) => received.push(msg));

      for (let i = 0; i < 100; i++) {
        bus._getSubject('RAPID1')?.next({
          type: 'task-update',
          payload: { sessionId: 'RAPID1' },
        });
      }

      expect(received).toHaveLength(100);
    });
  });
});
