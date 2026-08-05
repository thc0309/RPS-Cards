import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCatalogId, ProtocolError, RULESET_VERSION, validateClientAction } from './index.js';

test('validates a stable action envelope and keeps the MVP ruleset immutable', () => {
  const action = validateClientAction({ type: 'LOCK_CARD', operationId: 'op-1', expectedPhase: 'ROUND_SELECTION', expectedRound: 1, payload: { cardId: 'card-a-1' } });
  assert.equal(action.type, 'LOCK_CARD');
  assert.equal(RULESET_VERSION, 'classic_v1');
  assert.equal(validateClientAction({ type: 'REMATCH_READY', operationId: 'op-2', expectedPhase: 'MATCH_RESULT', expectedRound: 2, payload: { ready: true } }).expectedRound, 2);
});

test('rejects malformed action payloads with a stable protocol code', () => {
  assert.throws(() => validateClientAction({ type: 'LOCK_CARD', operationId: 'op-1', expectedRound: 1, payload: {} }), (error: unknown) => error instanceof ProtocolError && error.code === 'INVALID_MESSAGE');
  assert.throws(() => validateClientAction({ type: 'LOCK_CARD', operationId: 'op-1', expectedPhase: 'ROUND_SELECTION', expectedRound: 1, payload: { cardId: 'a', secret: 'b' } }), (error: unknown) => error instanceof ProtocolError && error.code === 'INVALID_MESSAGE');
});

test('normalizes unavailable cosmetics to the only MVP catalog entry', () => {
  assert.equal(normalizeCatalogId('future_paid_theme'), 'folk_default');
  assert.equal(normalizeCatalogId('folk_default'), 'folk_default');
});
