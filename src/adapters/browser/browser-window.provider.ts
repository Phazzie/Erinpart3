import { Injectable } from '@angular/core';
import { WindowProvider } from '../../core/ports/window.provider';

@Injectable({ providedIn: 'root' })
export class BrowserWindowProvider implements WindowProvider {
  getLocationHref(): string {
    return window.location.href;
  }

  getLocationOrigin(): string {
    return window.location.origin;
  }
}
