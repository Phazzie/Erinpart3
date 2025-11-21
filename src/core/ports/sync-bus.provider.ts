
import { Observable } from 'rxjs';

export interface SyncMessage {
  type: 'task-update';
  payload: {
    sessionId: string;
  };
}

export abstract class SyncBus {
  abstract publish(message: SyncMessage): void;
  abstract subscribe(channel: string): Observable<SyncMessage>;
}
