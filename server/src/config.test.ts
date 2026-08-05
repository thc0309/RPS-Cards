import test from 'node:test';
import assert from 'node:assert/strict';
import { loadServerConfig } from './config.js';

test('loads documented defaults', () => {
  assert.deepEqual(loadServerConfig({}), {
    host: '127.0.0.1',
    port: 2567,
    draftSelectionTimeoutMs: 5_000,
    roundSelectionTimeoutMs: 15_000,
    reconnectTimeoutMs: 25_000,
  });
});

test('rejects an out-of-range gameplay timeout', () => {
  assert.throws(
    () => loadServerConfig({ DRAFT_SELECTION_TIMEOUT_MS: '999' }),
    /DRAFT_SELECTION_TIMEOUT_MS must be between 1000 and 30000/,
  );
});
