import test from 'node:test';
import assert from 'node:assert/strict';
import { MessageRateLimiter } from './rate-limit.js';

test('rate limiter is deterministic and bounded by client count', () => {
  let now = 0;
  const limiter = new MessageRateLimiter({ maxMessagesPerSecond: 2, maxClients: 2, now: () => now });
  assert.equal(limiter.allow('a'), true);
  assert.equal(limiter.allow('a'), true);
  assert.equal(limiter.allow('a'), false);
  now = 1_000;
  assert.equal(limiter.allow('a'), true);
  limiter.allow('b'); limiter.allow('c');
  assert.equal(limiter.size, 2);
});
