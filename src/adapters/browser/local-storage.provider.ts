import { Injectable } from '@angular/core';
import { StorageProvider } from '../../core/ports/storage.provider';

@Injectable({ providedIn: 'root' })
export class LocalStorageProvider implements StorageProvider {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage unavailable (private browsing, quota exceeded, etc.)
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Storage unavailable
    }
  }
}
