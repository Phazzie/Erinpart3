import { Injectable, OnDestroy, inject } from '@angular/core';
import { Observable, EMPTY, filter } from 'rxjs';
import { SyncBus, SyncMessage } from '../../core/ports/sync-bus.provider';
import { LoggerService } from '../../core/services/logger.service';

@Injectable({ providedIn: 'root' })
export class BroadcastChannelBus implements SyncBus, OnDestroy {
  private logger = inject(LoggerService);
  private channels: Map<string, BroadcastChannel> = new Map();

  private get isSupported(): boolean {
    return typeof BroadcastChannel !== 'undefined';
  }

  private buildChannelName(sessionId: string): string {
    return `session-${sessionId}`;
  }

  private getChannel(channelName: string): BroadcastChannel | null {
    if (!this.isSupported) {
      return null;
    }

    if (!this.channels.has(channelName)) {
      this.channels.set(channelName, new BroadcastChannel(channelName));
    }
    return this.channels.get(channelName)!;
  }

  publish(message: SyncMessage): void {
    const channelName = this.buildChannelName(message.payload.sessionId);
    const channel = this.getChannel(channelName);

    if (channel) {
      channel.postMessage(message);
    } else {
      this.logger.warn('BroadcastChannel not supported, sync disabled');
    }
  }

  subscribe(sessionId: string): Observable<SyncMessage> {
    const channelName = this.buildChannelName(sessionId);
    const channel = this.getChannel(channelName);

    if (!channel) {
      this.logger.warn('BroadcastChannel not supported, returning empty observable');
      return EMPTY;
    }

    return new Observable<SyncMessage>(subscriber => {
      const handler = (event: MessageEvent) => {
        subscriber.next(event.data);
      };
      channel.addEventListener('message', handler);
      return () => channel.removeEventListener('message', handler);
    }).pipe(
      filter(msg => msg?.payload?.sessionId === sessionId)
    );
  }

  closeChannel(sessionId: string): void {
    const channelName = this.buildChannelName(sessionId);
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.close();
      this.channels.delete(channelName);
    }
  }

  ngOnDestroy(): void {
    this.channels.forEach(channel => channel.close());
    this.channels.clear();
  }
}
