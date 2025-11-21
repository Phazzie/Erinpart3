import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../../core/models/task';

@Component({
  selector: 'app-task-card',
  templateUrl: './task-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class TaskCardComponent {
  task = input.required<Task>();
  currentUserId = input.required<string>();

  reveal = output<Task>();

  isRevealed = computed(() => {
    const t = this.task();
    return !t.isSecret || t.revealVotes >= 2;
  });

  canVote = computed(() => {
    const t = this.task();
    return t.isSecret && !t.voterIds.includes(this.currentUserId()) && t.revealVotes < 2;
  });

  revealProgress = computed(() => {
    const votes = this.task().revealVotes;
    return `${votes}/2`;
  });

  onRevealClick() {
    if (this.canVote()) {
      this.reveal.emit(this.task());
    }
  }
}