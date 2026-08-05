export interface Deadline {
  readonly startedAt: number;
  readonly deadlineAt: number;
  readonly durationMs: number;
}

export function createDeadline(startedAt: number, durationMs: number): Deadline {
  return { startedAt, deadlineAt: startedAt + durationMs, durationMs };
}

export function remainingMs(deadline: Deadline, now: number): number {
  return Math.max(0, deadline.deadlineAt - now);
}

export function isExpired(deadline: Deadline, now: number): boolean {
  return now >= deadline.deadlineAt;
}
