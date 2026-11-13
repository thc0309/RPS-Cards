export { MessageRateLimiter } from '@rps-cards/game-core/room';

/** Fixed-window limiter for HTTP entry points, keyed by client address. */
export class WindowRateLimiter {
  private readonly buckets = new Map<string, { startedAt: number; count: number }>();

  constructor(private readonly max: number, private readonly windowMs: number, private readonly now: () => number = () => Date.now(), private readonly maxKeys = 4_096) {}

  allow(key: string): boolean {
    const now = this.now();
    let bucket = this.buckets.get(key);
    if (!bucket || now - bucket.startedAt >= this.windowMs) bucket = { startedAt: now, count: 0 };
    bucket.count += 1;
    this.buckets.delete(key);
    this.buckets.set(key, bucket);
    while (this.buckets.size > this.maxKeys) this.buckets.delete(this.buckets.keys().next().value!);
    return bucket.count <= this.max;
  }
}
