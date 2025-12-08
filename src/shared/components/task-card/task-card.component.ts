import { Component, ChangeDetectionStrategy, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../../core/models/task';
import { ConfigService } from '../../../core/services/config.service';

@Component({
  selector: 'app-task-card',
  templateUrl: './task-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class TaskCardComponent {
  private config = inject(ConfigService);

  task = input.required<Task>();
  currentUserId = input.required<string>();

  reveal = output<Task>();

  private revealThreshold = this.config.features.revealVoteThreshold;

  isRevealed = computed(() => {
    const t = this.task();
    return !t.isSecret || t.revealVotes >= this.revealThreshold;
  });

  canVote = computed(() => {
    const t = this.task();
    return t.isSecret && !t.voterIds.includes(this.currentUserId()) && t.revealVotes < this.revealThreshold;
  });

  revealProgress = computed(() => {
    const votes = this.task().revealVotes;
    return `${votes}/${this.revealThreshold}`;
  });

  onRevealClick() {
    if (this.canVote()) {
      this.reveal.emit(this.task());
    }
  }
}
