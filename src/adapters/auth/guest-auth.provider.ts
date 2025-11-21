import { Injectable, signal, WritableSignal } from '@angular/core';
import { AuthProvider, User } from '../../core/ports/auth.provider';

const GUEST_USER_KEY = 'erins-escapades-guest-user';

@Injectable({ providedIn: 'root' })
export class GuestAuthProvider implements AuthProvider {
  currentUser: WritableSignal<User | null> = signal(null);

  constructor() {
    this.initialize();
  }

  initialize(): void {
    try {
      const storedUser = localStorage.getItem(GUEST_USER_KEY);
      if (storedUser) {
        this.currentUser.set(JSON.parse(storedUser));
      } else {
        const newUser: User = {
          id: crypto.randomUUID(),
          name: 'Guest',
        };
        localStorage.setItem(GUEST_USER_KEY, JSON.stringify(newUser));
        this.currentUser.set(newUser);
      }
    } catch (e) {
      console.error('Failed to initialize guest auth:', e);
      // Fallback for environments where localStorage is not available
      const fallbackUser: User = { id: crypto.randomUUID(), name: 'Guest' };
      this.currentUser.set(fallbackUser);
    }
  }
}