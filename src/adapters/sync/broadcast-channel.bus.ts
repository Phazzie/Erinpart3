
import { Injectable } from '@angular/core';
import { Observable, filter } from 'rxjs';
import { SyncBus, SyncMessage } from '../../core/ports/sync-bus.provider';

@Injectable({ providedIn: 'root' })
export class BroadcastChannelBus implements SyncBus {
  private channels: Map<string, BroadcastChannel> = new Map();

  private getChannel(name: string): BroadcastChannel {
    if (!this.channels.has(name)) {
      this.channels.set(name, new BroadcastChannel(name));
    }
    return this.channels.get(name)!;
  }

  publish(message: SyncMessage): void {
    const channelName = `session-${message.payload.sessionId}`;
    this.getChannel(channelName).postMessage(message);
  }

  subscribe(channelId: string): Observable<SyncMessage> {
    const channelName = `session-${channelId}`;
    const channel = this.getChannel(channelName);
    
    return new Observable<SyncMessage>(subscriber => {
      const handler = (event: MessageEvent) => {
        subscriber.next(event.data);
      };
      channel.addEventListener('message', handler);
      return () => channel.removeEventListener('message', handler);
    }).pipe(
      filter(msg => msg?.payload?.sessionId === channelId)
    );
  }
}
