import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ConfigService } from '../../core/services/config.service';

const SESSION_ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CommonModule],
})
export class HomePageComponent {
  private router = inject(Router);
  private config = inject(ConfigService);

  sessionId = signal('');

  isSessionIdValid = computed(() => this.config.session.idPattern.test(this.sessionId()));

  joinSession(): void {
    if (this.sessionId().trim().length > 0) {
      this.router.navigate(['/s', this.sessionId().trim().toUpperCase()]);
    }
  }

  createNewSession(): void {
    const idLength = this.config.session.idLength;
    const randomValues = new Uint32Array(idLength);
    crypto.getRandomValues(randomValues);

    let newId = '';
    for (let i = 0; i < idLength; i++) {
      newId += SESSION_ID_CHARS[randomValues[i] % SESSION_ID_CHARS.length];
    }

    this.router.navigate(['/s', newId]);
  }
}
