import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CommonModule],
})
export class HomePageComponent {
  sessionId = signal('');

  isSessionIdValid = computed(() => /^[A-Z0-9]{6}$/.test(this.sessionId()));

  constructor(private router: Router) {}

  joinSession() {
    if (this.sessionId().trim().length > 0) {
      this.router.navigate(['/s', this.sessionId().trim().toUpperCase()]);
    }
  }

  createNewSession() {
    const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.router.navigate(['/s', newId]);
  }
}