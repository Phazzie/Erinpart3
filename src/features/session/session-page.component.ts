import { Component, ChangeDetectionStrategy, signal, inject, computed, effect, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs/operators';

import { Task } from '../../core/models/task';
import { AuthProvider } from '../../core/ports/auth.provider';
import { ClipboardProvider } from '../../core/ports/clipboard.provider';
import { WindowProvider } from '../../core/ports/window.provider';
import { TaskCardComponent } from '../../shared/components/task-card/task-card.component';
import { TaskService } from '../../core/services/task.service';
import { ConfigService } from '../../core/services/config.service';
import { LoggerService } from '../../core/services/logger.service';

@Component({
  selector: 'app-session-page',
  templateUrl: './session-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, TaskCardComponent],
})
export class SessionPageComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authProvider = inject(AuthProvider);
  private clipboard = inject(ClipboardProvider);
  private windowProvider = inject(WindowProvider);
  private config = inject(ConfigService);
  private logger = inject(LoggerService);
  taskService = inject(TaskService);

  private copyTimeoutId: ReturnType<typeof setTimeout> | null = null;

  @ViewChild('qrCanvas') qrCanvas: ElementRef<HTMLCanvasElement> | undefined;

  // Pure data derivation - just read the route param
  sessionId = toSignal(
    this.route.paramMap.pipe(map(params => params.get('sessionId')))
  );

  currentUser = this.authProvider.currentUser;

  newTaskContent = signal('');
  isNewTaskSecret = signal(false);

  isShareModalOpen = signal(false);
  sessionUrl = computed(() => {
    const baseUrl = this.windowProvider.getLocationHref().split('#')[0];
    const id = this.sessionId();
    if (!id) return baseUrl;
    return `${baseUrl}#/s/${encodeURIComponent(id)}`;
  });
  copyButtonText = signal('Copy Link');

  constructor() {
    // Side-effect: validate session ID and sync with task service
    effect(() => {
      const id = this.sessionId();
      if (!id || !this.config.session.idPattern.test(id)) {
        if (id !== null && id !== undefined) {
          this.logger.warn('Invalid session ID, redirecting to home');
          this.router.navigate(['/']);
        }
        this.taskService.sessionId.set(null);
      } else {
        this.taskService.sessionId.set(id);
      }
    });

    // Side-effect: render QR code when modal opens
    effect(() => {
      if (this.isShareModalOpen() && this.qrCanvas?.nativeElement && this.sessionId()) {
        this.renderQrCode();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.copyTimeoutId) {
      clearTimeout(this.copyTimeoutId);
    }
  }

  async addTask(): Promise<void> {
    await this.runWithErrorHandling('Failed to add task', async () => {
      await this.taskService.addTask(this.newTaskContent(), this.isNewTaskSecret());
      this.newTaskContent.set('');
      this.isNewTaskSecret.set(false);
    });
  }

  async handleReveal(task: Task): Promise<void> {
    await this.runWithErrorHandling('Failed to reveal task', () =>
      this.taskService.revealTask(task)
    );
  }

  toggleShareModal(): void {
    this.isShareModalOpen.update(v => !v);
    if (!this.isShareModalOpen()) {
      this.copyButtonText.set('Copy Link');
    }
  }

  copyLink(): void {
    this.clipboard.writeText(this.sessionUrl()).then(() => {
      this.copyButtonText.set('Copied!');
      this.scheduleCopyReset();
    }).catch(err => {
      this.logger.error('Failed to copy to clipboard', err);
    });
  }

  // --- Private helpers ---

  private async runWithErrorHandling<T>(
    errorMessage: string,
    fn: () => Promise<T>
  ): Promise<T | void> {
    try {
      return await fn();
    } catch (error) {
      this.logger.error(errorMessage, error);
    }
  }

  private scheduleCopyReset(): void {
    if (this.copyTimeoutId) {
      clearTimeout(this.copyTimeoutId);
    }
    this.copyTimeoutId = setTimeout(() => {
      this.copyButtonText.set('Copy Link');
      this.copyTimeoutId = null;
    }, this.config.ui.copyFeedbackDuration);
  }

  private renderQrCode(): void {
    try {
      const qrConfig = this.config.qrCode;
      QRCode.toCanvas(this.qrCanvas!.nativeElement, this.sessionUrl(), {
        width: qrConfig.width,
        margin: qrConfig.margin,
        color: {
          dark: qrConfig.colorDark,
          light: qrConfig.colorLight
        }
      });
    } catch (error) {
      this.logger.error('Failed to generate QR code', error);
    }
  }
}
