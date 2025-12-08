import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly isProd = environment.production;

  debug(message: string, ...args: unknown[]): void {
    if (!this.isProd) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (!this.isProd) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }

  error(message: string, error?: unknown): void {
    console.error(`[ERROR] ${message}`, error);
    // In production, you could send to error tracking service here
  }
}
