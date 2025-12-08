import { Injectable } from '@angular/core';
import { WindowProvider } from '../../core/ports/window.provider';

const SSR_FALLBACK_HREF = 'http://localhost/';
const SSR_FALLBACK_ORIGIN = 'http://localhost';

@Injectable({ providedIn: 'root' })
export class BrowserWindowProvider implements WindowProvider {
  private get isBrowser(): boolean {
    return typeof window !== 'undefined' && !!window.location;
  }

  getLocationHref(): string {
    if (this.isBrowser) {
      return window.location.href;
    }
    return SSR_FALLBACK_HREF;
  }

  getLocationOrigin(): string {
    if (this.isBrowser) {
      return window.location.origin;
    }
    return SSR_FALLBACK_ORIGIN;
  }
}
