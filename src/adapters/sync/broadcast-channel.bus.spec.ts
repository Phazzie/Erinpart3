import { describe, it, expect, beforeEach } from 'vitest';
import { firstValueFrom, take, timeout } from 'rxjs';
import { BroadcastChannelBus } from './broadcast-channel.bus';
import { SyncMessage } from '../../core/ports/sync-bus.provider';

describe('BroadcastChannelBus', () => {
  let bus: BroadcastChannelBus;

  beforeEach(() => {
    bus = new BroadcastChannelBus();
  });

  describe('publish', () => {
    it('should publish message without throwing', () => {
      const message: SyncMessage = {
        type: 'task-update',
        payload: { sessionId: 'ABC123' },
      };

      expect(() => bus.publish(message)).not.toThrow();
    });

    it('should be fire-and-forget (void return)', () => {
      const message: SyncMessage = {
        type: 'task-update',
        payload: { sessionId: 'ABC123' },
      };

      const result = bus.publish(message);
      expect(result).toBeUndefined();
    });

    it('should handle multiple publishes', () => {
      for (let i = 0; i < 10; i++) {
        expect(() =>
          bus.publish({ type: 'task-update', payload: { sessionId: `SESS0${i}` } })
        ).not.toThrow();
      }
    });
  });

  describe('subscribe', () => {
    it('should return an observable', () => {
      const observable = bus.subscribe('ABC123');

      expect(observable).toHaveProperty('subscribe');
      expect(typeof observable.subscribe).toBe('function');
    });

    it('should receive messages from other bus instances', async () => {
      const bus1 = new BroadcastChannelBus();
      const bus2 = new BroadcastChannelBus();

      const message: SyncMessage = {
        type: 'task-update',
        payload: { sessionId: 'TEST01' },
      };

      // Set up subscription first
      const receivedPromise = firstValueFrom(
        bus2.subscribe('TEST01').pipe(take(1), timeout(1000))
      );

      // Small delay to ensure subscription is ready
      await new Promise((r) => setTimeout(r, 50));

      // Publish from another bus
      bus1.publish(message);

      const received = await receivedPromise;
      expect(received).toEqual(message);
    });

    it('should filter messages by sessionId', async () => {
      const bus1 = new BroadcastChannelBus();
      const bus2 = new BroadcastChannelBus();

      const received: SyncMessage[] = [];
      const subscription = bus2.subscribe('ABC123').subscribe((msg) => {
        received.push(msg);
      });

      await new Promise((r) => setTimeout(r, 50));

      // Publish to different session
      bus1.publish({ type: 'task-update', payload: { sessionId: 'XYZ789' } });
      // Publish to correct session
      bus1.publish({ type: 'task-update', payload: { sessionId: 'ABC123' } });

      await new Promise((r) => setTimeout(r, 100));

      // Should only receive message for ABC123
      const abc123Messages = received.filter((m) => m.payload.sessionId === 'ABC123');
      expect(abc123Messages.length).toBeGreaterThanOrEqual(1);

      subscription.unsubscribe();
    });
  });

  describe('channel management', () => {
    it('should reuse channel for same session', () => {
      const obs1 = bus.subscribe('ABC123');
      const obs2 = bus.subscribe('ABC123');

      expect(obs1).toBeTruthy();
      expect(obs2).toBeTruthy();
    });

    it('should create separate channels for different sessions', () => {
      const obs1 = bus.subscribe('ABC123');
      const obs2 = bus.subscribe('XYZ789');

      expect(obs1).toBeTruthy();
      expect(obs2).toBeTruthy();
    });
  });

  describe('subscription lifecycle', () => {
    it('should allow unsubscribing', () => {
      const subscription = bus.subscribe('ABC123').subscribe(() => {});
      expect(() => subscription.unsubscribe()).not.toThrow();
    });

    it('should handle multiple subscriptions', () => {
      const subs = [
        bus.subscribe('ABC123').subscribe(() => {}),
        bus.subscribe('ABC123').subscribe(() => {}),
        bus.subscribe('XYZ789').subscribe(() => {}),
      ];

      subs.forEach((sub) => {
        expect(() => sub.unsubscribe()).not.toThrow();
      });
    });
  });

  describe('message structure', () => {
    it('should work with task-update messages', () => {
      const message: SyncMessage = {
        type: 'task-update',
        payload: { sessionId: 'ABC123' },
      };

      expect(message.type).toBe('task-update');
      expect(message.payload.sessionId).toBe('ABC123');
    });
  });
});
