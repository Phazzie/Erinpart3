
import { Observable } from 'rxjs';
import { Task } from '../models/task';

export abstract class TaskStore {
  abstract list(sessionId: string): Promise<Task[]>;
  abstract save(task: Task): Promise<void>;
  abstract watch(sessionId: string): Observable<Task[]>;
}
