import { Injectable, signal, computed, inject } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { map, switchMap, catchError, startWith, filter } from 'rxjs/operators';

import { Task } from '../models/task';
import { TaskStore } from '../ports/task-store.provider';
import { SyncBus } from '../ports/sync-bus.provider';
import { AuthProvider } from '../ports/auth.provider';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private taskStore = inject(TaskStore);
  private syncBus = inject(SyncBus);
  private authProvider = inject(AuthProvider);

  readonly sessionId = signal<string | null>(null);

  private tasksState = toSignal(
    toObservable(this.sessionId).pipe(
      filter((id): id is string => !!id),
      switchMap(id => this.taskStore.watch(id).pipe(
        map(tasks => ({ loading: false, tasks, error: null })),
        startWith({ loading: true, tasks: [], error: null }),
        catchError(error => {
          console.error('Error watching tasks:', error);
          return of({ loading: false, tasks: [], error });
        })
      ))
    ),
    { initialValue: { loading: true, tasks: [], error: null } }
  );

  readonly tasks = computed(() => 
    this.tasksState().tasks.slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  );
  readonly isLoading = computed(() => this.tasksState().loading);
  
  async addTask(content: string, isSecret: boolean): Promise<void> {
    const currentSessionId = this.sessionId();
    const user = this.authProvider.currentUser();
    if (content.trim() === '' || !currentSessionId || !user) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      sessionId: currentSessionId,
      content: content.trim(),
      isSecret: isSecret,
      revealVotes: 0,
      voterIds: [],
      createdAt: new Date().toISOString(),
    };

    try {
      await this.taskStore.save(newTask);
      this.syncBus.publish({ type: 'task-update', payload: { sessionId: currentSessionId } });
    } catch (e) {
      console.error('Failed to add task:', e);
    }
  }

  async revealTask(task: Task): Promise<void> {
    const user = this.authProvider.currentUser();
    const currentSessionId = this.sessionId();
    if (!user || !currentSessionId || task.voterIds.includes(user.id)) return;

    const updatedTask: Task = {
      ...task,
      voterIds: [...task.voterIds, user.id],
      revealVotes: task.voterIds.length + 1,
    };

    try {
      await this.taskStore.save(updatedTask);
      this.syncBus.publish({ type: 'task-update', payload: { sessionId: currentSessionId } });
    } catch (e) {
      console.error('Failed to update task for reveal:', e);
    }
  }
}
