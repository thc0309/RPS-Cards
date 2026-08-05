import test from 'node:test';
import assert from 'node:assert/strict';
import { ProtocolError } from '@rps-cards/game-core';
import { RoomDirectory } from './room-entry.js';

test('room directory creates, validates and joins without public enumeration', () => {
  const directory = new RoomDirectory();
  const created = directory.create();
  assert.equal(directory.validate(created.roomCode), 'available');
  const joined = directory.join(created.roomCode, 'guest-b');
  assert.equal(joined.seat, 'PLAYER_B');
  assert.equal(directory.validate(created.roomCode), 'full');
  assert.throws(() => directory.join(created.roomCode, 'guest-c'), (error: unknown) => error instanceof ProtocolError && error.code === 'ROOM_FULL');
  assert.equal(Object.keys(created).sort().join(','), 'reconnectToken,roomCode,sessionId');
  directory.get(created.roomCode)?.dispose();
});

test('unknown room returns a stable expired status', () => {
  const directory = new RoomDirectory();
  assert.equal(directory.validate('ABCD2'), 'expired');
  assert.throws(() => directory.join('ABCD2'), (error: unknown) => error instanceof ProtocolError && error.code === 'ROOM_EXPIRED');
});
