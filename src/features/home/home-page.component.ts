import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ConfigService } from '../../core/services/config.service';

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

  joinSession() {
    if (this.sessionId().trim().length > 0) {
      this.router.navigate(['/s', this.sessionId().trim().toUpperCase()]);
    }
  }

  createNewSession() {
    const newId = crypto.randomUUID().substring(0, this.config.session.idLength).toUpperCase();
    this.router.navigate(['/s', newId]);
  }
}
