import { Injectable } from '@angular/core';

@Injectable()
export abstract class StorageProvider {
  abstract getItem(key: string): string | null;
  abstract setItem(key: string, value: string): void;
  abstract removeItem(key: string): void;
}
