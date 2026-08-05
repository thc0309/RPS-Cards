export class MessageRateLimiter {
  private readonly buckets = new Map<string, { startedAt: number; count: number }>();
  constructor(private readonly options: { readonly maxMessagesPerSecond?: number; readonly maxClients?: number; readonly now?: () => number } = {}) {}
  allow(clientId: string): boolean {
    const now = this.options.now?.() ?? Date.now();
    let bucket = this.buckets.get(clientId);
    if (!bucket || now - bucket.startedAt >= 1_000) bucket = { startedAt: now, count: 0 };
    bucket.count += 1;
    this.buckets.delete(clientId);
    this.buckets.set(clientId, bucket);
    const maxClients = this.options.maxClients ?? 128;
    while (this.buckets.size > maxClients) this.buckets.delete(this.buckets.keys().next().value!);
    return bucket.count <= (this.options.maxMessagesPerSecond ?? 20);
  }
  get size(): number { return this.buckets.size; }
}
