
import { z } from 'https://cdn.jsdelivr.net/npm/zod@3.23.8/+esm';

export const TaskSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().regex(/^[A-Z0-9]{6}$/),
  content: z.string().min(1).max(200),
  isSecret: z.boolean(),
  revealVotes: z.number().int().nonnegative(),
  voterIds: z.array(z.string().uuid()),
  createdAt: z.string().datetime({ offset: true }),
});

export type Task = z.infer<typeof TaskSchema>;
