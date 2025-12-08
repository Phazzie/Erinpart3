import { Injectable } from '@angular/core';

@Injectable()
export abstract class ClipboardProvider {
  abstract writeText(text: string): Promise<void>;
  abstract readText(): Promise<string>;
}
