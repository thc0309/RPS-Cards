import test from 'node:test';
import assert from 'node:assert/strict';
import { ProtocolError } from '@rps-cards/game-core';
import { RpsRoomController } from './rooms/RpsRoom.js';
import { RpsRoomState } from './rooms/schema.js';

const lock = (operationId: string, expectedRound = 1) => ({ type: 'LOCK_CARD', operationId, expectedPhase: 'ROUND_SELECTION', expectedRound, payload: { cardId: 'hidden-card' } });

test('Colyseus schema carries only public room metadata', () => {
  const state = new RpsRoomState({ roomCode: 'ABCD2', rulesetVersion: 'classic_v1', phase: 'WAITING', round: 1, playerCount: 0 });
  assert.deepEqual(state.toJSON(), { roomCode: 'ABCD2', rulesetVersion: 'classic_v1', phase: 'WAITING', round: 1, playerCount: 0 });
});

test('room accepts two seats and rejects a third', () => {
  const room = new RpsRoomController('ABCD2');
  assert.equal(room.join('a'), 'PLAYER_A');
  assert.equal(room.join('b'), 'PLAYER_B');
  assert.throws(() => room.join('c'), (error: unknown) => error instanceof ProtocolError && error.code === 'ROOM_FULL');
});

test('room rejects stale/conflicting operations without mutating and is idempotent', () => {
  const room = new RpsRoomController('ABCD2');
  room.join('a');
  room.join('b');
  assert.throws(() => room.handle('a', lock('stale', 2)), (error: unknown) => error instanceof ProtocolError && error.code === 'STALE_OPERATION');
  const first = room.handle('a', lock('same'));
  const replay = room.handle('a', lock('same'));
  assert.deepEqual(replay, first);
  assert.throws(() => room.handle('a', lock('same').payload ? { ...lock('same'), payload: { cardId: 'different' } } : lock('same')), (error: unknown) => error instanceof ProtocolError && error.code === 'OPERATION_CONFLICT');
});

test('projection includes own secrets and omits opponent secrets and uiThemeId', () => {
  const room = new RpsRoomController('ABCD2');
  room.join('a');
  room.join('b');
  const projection = room.projection('a');
  assert.deepEqual(Object.keys(projection).sort(), ['own', 'phase', 'players', 'roomCode', 'round', 'rulesetVersion']);
  assert.deepEqual(Object.keys(projection.own).sort(), ['boardThemeId', 'cardCount', 'cardSkinId', 'discards', 'draft', 'hand', 'locked', 'score', 'seat']);
  assert.equal('uiThemeId' in projection, false);
  assert.equal('hand' in projection.players[1]!, false);
  assert.equal('draft' in projection.players[1]!, false);
});
