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

  sessionId = toSignal(
    this.route.paramMap.pipe(
      map(params => {
        const id = params.get('sessionId');
        if (!id || !this.config.session.idPattern.test(id)) {
          this.logger.warn('Invalid session ID, redirecting to home');
          this.router.navigate(['/']);
          return null;
        }
        return id;
      })
    )
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
    effect(() => {
      this.taskService.sessionId.set(this.sessionId() ?? null);
    });

    effect(() => {
      if (this.isShareModalOpen() && this.qrCanvas?.nativeElement && this.sessionId()) {
        try {
          const qrConfig = this.config.qrCode;
          QRCode.toCanvas(this.qrCanvas.nativeElement, this.sessionUrl(), {
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
    });
  }

  ngOnDestroy(): void {
    if (this.copyTimeoutId) {
      clearTimeout(this.copyTimeoutId);
    }
  }

  async addTask(): Promise<void> {
    try {
      await this.taskService.addTask(this.newTaskContent(), this.isNewTaskSecret());
      this.newTaskContent.set('');
      this.isNewTaskSecret.set(false);
    } catch (error) {
      this.logger.error('Failed to add task', error);
    }
  }

  async handleReveal(task: Task): Promise<void> {
    try {
      await this.taskService.revealTask(task);
    } catch (error) {
      this.logger.error('Failed to reveal task', error);
    }
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
      if (this.copyTimeoutId) {
        clearTimeout(this.copyTimeoutId);
      }
      this.copyTimeoutId = setTimeout(() => {
        this.copyButtonText.set('Copy Link');
        this.copyTimeoutId = null;
      }, this.config.ui.copyFeedbackDuration);
    }).catch(err => {
      this.logger.error('Failed to copy to clipboard', err);
    });
  }
}
