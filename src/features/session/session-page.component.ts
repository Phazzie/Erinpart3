import { Component, ChangeDetectionStrategy, signal, inject, computed, effect, ViewChild, ElementRef } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
export class SessionPageComponent {
  private route = inject(ActivatedRoute);
  private authProvider = inject(AuthProvider);
  private clipboard = inject(ClipboardProvider);
  private windowProvider = inject(WindowProvider);
  private config = inject(ConfigService);
  private logger = inject(LoggerService);
  taskService = inject(TaskService);

  @ViewChild('qrCanvas') qrCanvas: ElementRef<HTMLCanvasElement> | undefined;

  sessionId = toSignal(
    this.route.paramMap.pipe(map(params => params.get('sessionId')!))
  );

  currentUser = this.authProvider.currentUser;

  newTaskContent = signal('');
  isNewTaskSecret = signal(false);

  isShareModalOpen = signal(false);
  sessionUrl = computed(() => {
    const baseUrl = this.windowProvider.getLocationHref().split('#')[0];
    return `${baseUrl}#/s/${this.sessionId()}`;
  });
  copyButtonText = signal('Copy Link');

  constructor() {
    effect(() => {
      this.taskService.sessionId.set(this.sessionId() ?? null);
    });

    effect(() => {
      if (this.isShareModalOpen() && this.qrCanvas?.nativeElement && this.sessionId()) {
        const qrConfig = this.config.qrCode;
        QRCode.toCanvas(this.qrCanvas.nativeElement, this.sessionUrl(), {
          width: qrConfig.width,
          margin: qrConfig.margin,
          color: {
            dark: qrConfig.colorLight,
            light: qrConfig.colorDark
          }
        });
      }
    });
  }

  async addTask() {
    await this.taskService.addTask(this.newTaskContent(), this.isNewTaskSecret());
    this.newTaskContent.set('');
    this.isNewTaskSecret.set(false);
  }

  handleReveal(task: Task) {
    this.taskService.revealTask(task);
  }

  toggleShareModal() {
    this.isShareModalOpen.update(v => !v);
    if (!this.isShareModalOpen()) {
      this.copyButtonText.set('Copy Link');
    }
  }

  copyLink() {
    this.clipboard.writeText(this.sessionUrl()).then(() => {
      this.copyButtonText.set('Copied!');
      setTimeout(() => this.copyButtonText.set('Copy Link'), this.config.ui.copyFeedbackDuration);
    }).catch(err => {
      this.logger.error('Failed to copy to clipboard', err);
    });
  }
}
