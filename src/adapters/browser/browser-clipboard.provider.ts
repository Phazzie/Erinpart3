import { Injectable } from '@angular/core';
import { ClipboardProvider } from '../../core/ports/clipboard.provider';

@Injectable({ providedIn: 'root' })
export class BrowserClipboardProvider implements ClipboardProvider {
  async writeText(text: string): Promise<void> {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      throw new Error('Clipboard API not available');
    }
  }

  async readText(): Promise<string> {
    if (navigator.clipboard) {
      return navigator.clipboard.readText();
    }
    throw new Error('Clipboard API not available');
  }
}
