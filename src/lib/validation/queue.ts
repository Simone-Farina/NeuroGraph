import { z } from 'zod';

/** The four valid queue item states (forward-only funnel) */
export const QueueItemStateSchema = z.enum(['inbox', 'passive_debt', 'resource', 'mastered']);

/**
 * Schema for creating a new queue item.
 * source_domain, favicon_url, estimated_read_time are server-extracted -- never client-supplied.
 */
export const QueueItemInsertSchema = z.object({
  title: z.string().min(1).max(500).nullable().optional(),
  url: z.string().url().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
}).refine(
  (value) => Boolean(value.title ?? value.url),
  {
    message: 'Either title or url is required',
    path: ['title'],
  }
);

/** Schema for state transition requests (PATCH). */
export const QueueStateTransitionSchema = z.object({
  state: QueueItemStateSchema,
});

/** Valid state transitions (forward-only funnel). Used for server-side validation. */
export const VALID_TRANSITIONS: Record<string, string[]> = {
  inbox: ['passive_debt', 'resource'],
  passive_debt: ['mastered'],
  resource: ['passive_debt'],
  mastered: [], // terminal state -- no transitions allowed
};

export type QueueItemInsert = z.infer<typeof QueueItemInsertSchema>;
export type QueueStateTransition = z.infer<typeof QueueStateTransitionSchema>;
