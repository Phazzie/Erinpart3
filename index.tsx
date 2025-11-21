
import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';

import { AppComponent } from './src/app.component';
import { APP_ROUTES } from './src/app.routes';

import { AuthProvider } from './src/core/ports/auth.provider';
import { GuestAuthProvider } from './src/adapters/auth/guest-auth.provider';
import { SyncBus } from './src/core/ports/sync-bus.provider';
import { BroadcastChannelBus } from './src/adapters/sync/broadcast-channel.bus';
import { TaskStore } from './src/core/ports/task-store.provider';
import { IndexedDbTaskStore } from './src/adapters/storage/indexeddb-task.store';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(APP_ROUTES, withHashLocation()),
    { provide: AuthProvider, useClass: GuestAuthProvider },
    { provide: SyncBus, useClass: BroadcastChannelBus },
    { provide: TaskStore, useClass: IndexedDbTaskStore },
  ],
}).catch(err => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.
