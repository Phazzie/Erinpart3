import { Component, ChangeDetectionStrategy, signal, inject, computed, effect, ViewChild, ElementRef } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs/operators';

import { Task } from '../../core/models/task';
import { AuthProvider } from '../../core/ports/auth.provider';
import { TaskCardComponent } from '../../shared/components/task-card/task-card.component';
import { TaskService } from '../../core/services/task.service';

declare var QRCode: any;

@Component({
  selector: 'app-session-page',
  templateUrl: './session-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, TaskCardComponent],
})
export class SessionPageComponent {
  private route = inject(ActivatedRoute);
  private authProvider = inject(AuthProvider);
  taskService = inject(TaskService);

  @ViewChild('qrCanvas') qrCanvas: ElementRef<HTMLCanvasElement> | undefined;

  sessionId = toSignal(
    this.route.paramMap.pipe(map(params => params.get('sessionId')!))
  );
  
  currentUser = this.authProvider.currentUser;

  newTaskContent = signal('');
  isNewTaskSecret = signal(false);

  isShareModalOpen = signal(false);
  sessionUrl = computed(() => `${window.location.href.split('#')[0]}#/s/${this.sessionId()}`);
  copyButtonText = signal('Copy Link');

  constructor() {
    // Link component's sessionId to the service's sessionId
    effect(() => {
      this.taskService.sessionId.set(this.sessionId() ?? null);
    });

    // Effect for rendering QR code
    effect(() => {
      if (this.isShareModalOpen() && this.qrCanvas?.nativeElement && this.sessionId()) {
        QRCode.toCanvas(this.qrCanvas.nativeElement, this.sessionUrl(), { 
          width: 256, 
          margin: 2,
          color: {
            dark: '#cffafe', // brand-light
            light: '#083344'  // brand-primary
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
    navigator.clipboard.writeText(this.sessionUrl()).then(() => {
      this.copyButtonText.set('Copied!');
      setTimeout(() => this.copyButtonText.set('Copy Link'), 2000);
    });
  }
}