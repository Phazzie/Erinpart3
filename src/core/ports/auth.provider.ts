
import { WritableSignal } from '@angular/core';

export interface User {
  id: string;
  name: string;
}

export abstract class AuthProvider {
  abstract currentUser: WritableSignal<User | null>;
  abstract initialize(): void;
}
