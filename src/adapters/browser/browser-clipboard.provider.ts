import { Injectable } from '@angular/core';
import { ClipboardProvider } from '../../core/ports/clipboard.provider';

@Injectable({ providedIn: 'root' })
export class BrowserClipboardProvider implements ClipboardProvider {
  private get isAvailable(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.clipboard;
  }

  async writeText(text: string): Promise<void> {
    if (this.isAvailable) {
      await navigator.clipboard.writeText(text);
    } else {
      throw new Error('Clipboard API not available in this environment');
    }
  }

  async readText(): Promise<string> {
    if (this.isAvailable) {
      return navigator.clipboard.readText();
    }
    throw new Error('Clipboard API not available in this environment');
  }
}
