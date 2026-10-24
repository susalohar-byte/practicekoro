import type { AdminTestAttempt } from './testAttemptTypes';

/** Attempt instant: the ISO created_at when provided, else the displayed local date/time. */
export const attemptTimestamp = (att: AdminTestAttempt) =>
  att.createdAt
    ? Date.parse(att.createdAt)
    : Date.parse(`${att.attemptedAtDate} ${att.attemptedAtTime || ''}`.trim());
