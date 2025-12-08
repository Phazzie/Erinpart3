import { Injectable, signal, WritableSignal, inject } from '@angular/core';
import { AuthProvider, User } from '../../core/ports/auth.provider';
import { StorageProvider } from '../../core/ports/storage.provider';
import { LoggerService } from '../../core/services/logger.service';

const GUEST_USER_KEY = 'erins-escapades-guest-user';

function isValidUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    typeof (value as User).id === 'string' &&
    typeof (value as User).name === 'string'
  );
}

@Injectable({ providedIn: 'root' })
export class GuestAuthProvider implements AuthProvider {
  private storage = inject(StorageProvider);
  private logger = inject(LoggerService);

  currentUser: WritableSignal<User | null> = signal(null);

  constructor() {
    this.initialize();
  }

  initialize(): void {
    try {
      const storedUser = this.storage.getItem(GUEST_USER_KEY);
      if (storedUser) {
        const parsed: unknown = JSON.parse(storedUser);
        if (isValidUser(parsed)) {
          this.currentUser.set(parsed);
        } else {
          this.logger.warn('Invalid user data in storage, creating new user');
          this.createAndStoreNewUser();
        }
      } else {
        this.createAndStoreNewUser();
      }
    } catch (e) {
      this.logger.error('Failed to initialize guest auth', e);

      // Clear potentially invalid stored user and create a fresh, persisted guest user
      try {
        this.storage.removeItem(GUEST_USER_KEY);
      } catch (storageError) {
        this.logger.warn('Failed to clear invalid guest user from storage', storageError);
      }

      this.createAndStoreNewUser();
    }
  }

  private createAndStoreNewUser(): void {
    const newUser: User = {
      id: crypto.randomUUID(),
      name: 'Guest',
    };
    this.storage.setItem(GUEST_USER_KEY, JSON.stringify(newUser));
    this.currentUser.set(newUser);
  }
}
