import { Injectable } from '@angular/core';

@Injectable()
export abstract class WindowProvider {
  abstract getLocationHref(): string;
  abstract getLocationOrigin(): string;
}
