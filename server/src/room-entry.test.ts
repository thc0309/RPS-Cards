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

test('join rejects a session id that already belongs to the room', () => {
  const directory = new RoomDirectory();
  const created = directory.create();
  assert.throws(
    () => directory.join(created.roomCode, created.sessionId),
    (error: unknown) => error instanceof ProtocolError && error.code === 'UNAUTHORIZED_SEAT',
  );
  directory.get(created.roomCode)?.dispose();
});

test('a room survives one player leaving and is evicted once both are gone', () => {
  const directory = new RoomDirectory();
  const host = directory.create();
  const guest = directory.join(host.roomCode, 'guest-b');
  directory.leave(host.roomCode, host.sessionId);
  // The remaining player still reaches the room and sees the forfeit result.
  const remaining = directory.get(host.roomCode)?.projection(guest.sessionId);
  assert.equal(remaining?.phase, 'MATCH_RESULT');
  assert.equal(remaining?.opponentLeft, true);
  assert.equal(directory.validate(host.roomCode), 'expired');
  directory.leave(host.roomCode, guest.sessionId);
  assert.equal(directory.get(host.roomCode), undefined);
  assert.equal(directory.validate(host.roomCode), 'expired');
});

test('abandoned rooms are swept so the directory cannot fill up', () => {
  let now = 1_000;
  const directory = new RoomDirectory({ now: () => now, reconnectTimeoutMs: 25_000 });
  const abandoned = directory.create();
  now += 24_000;
  assert.equal(directory.validate(abandoned.roomCode), 'available');
  now += 2_000;
  assert.equal(directory.validate(abandoned.roomCode), 'expired');
  assert.equal(directory.get(abandoned.roomCode), undefined);
});
