import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoomLog } from './rooms/logging.js';

test('room logs contain only safe operational fields', () => {
  const log = createRoomLog({ event: 'action_rejected', roomCode: 'ABCD2', phase: 'ROUND_SELECTION', round: 1, operationId: 'op-1', errorCode: 'INVALID_MESSAGE' });
  assert.deepEqual(Object.keys(log).sort(), ['errorCode', 'event', 'operationId', 'phase', 'roomCode', 'round']);
  assert.equal('secretCard' in log, false);
  assert.equal('resumeCredential' in log, false);
});
