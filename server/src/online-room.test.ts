import test from 'node:test';
import assert from 'node:assert/strict';
import { ROUND_PREPARE_MS, ROUND_PRESENTATION_MS, ProtocolError, resolveRound } from '@rps-cards/game-core';
import { OnlineRoomController, type OnlineTimerApi } from './rooms/online-room.js';

class FakeTimer implements OnlineTimerApi {
  now = 1000;
  callback: (() => void) | null = null;
  delayMs: number | null = null;
  setTimeout(callback: () => void, delayMs: number): unknown { this.callback = callback; this.delayMs = delayMs; return callback; }
  clearTimeout(): void { this.callback = null; }
  fire(): void { const callback = this.callback; this.callback = null; this.now += this.delayMs ?? 0; callback?.(); }
}

function pick(operationId: string, phase: 'DRAFT_PLAYER_A' | 'DRAFT_PLAYER_B', position: number) {
  return { type: 'DRAFT_PICK', operationId, expectedPhase: phase, expectedRound: 0, payload: { position } } as const;
}

test('online draft uses separate validated turns and never leaks the opponent pick', () => {
  const timer = new FakeTimer();
  const room = new OnlineRoomController('ABCD2', { randomInt: () => 0, timer, now: () => timer.now });
  room.join('a');
  room.join('b');
  const first = room.projection('a');
  const active = first.phase === 'DRAFT_PLAYER_A' ? 'a' : 'b';
  const inactive = active === 'a' ? 'b' : 'a';
  const activeProjection = room.projection(active);
  const position = activeProjection.own.draft && 'availablePositions' in activeProjection.own.draft ? activeProjection.own.draft.availablePositions[0]!.position : 0;
  const afterFirst = room.handle(active, pick('draft-1', first.phase as 'DRAFT_PLAYER_A' | 'DRAFT_PLAYER_B', position));
  assert.equal('selectedPosition' in afterFirst.own.draft!, true);
  const inactiveProjection = room.projection(inactive);
  assert.equal('selectedPosition' in inactiveProjection.own.draft!, false);
  assert.equal(inactiveProjection.own.draft && 'opponentHasPicked' in inactiveProjection.own.draft ? inactiveProjection.own.draft.opponentHasPicked : false, true);
  const next = room.projection(inactiveProjection.phase === 'DRAFT_PLAYER_A' ? 'a' : 'b');
  const secondPosition = next.own.draft && 'availablePositions' in next.own.draft ? next.own.draft.availablePositions[0]!.position : 0;
  const complete = room.handle(inactive, pick('draft-2', inactiveProjection.phase as 'DRAFT_PLAYER_A' | 'DRAFT_PLAYER_B', secondPosition));
  assert.equal(complete.phase, 'ROUND_SELECTION');
  assert.equal(complete.own.hand.length, 4);
  assert.equal(complete.own.draft, null);
  room.dispose();
});

test('waiting projection reports only occupied seats', () => {
  const room = new OnlineRoomController('ABCD2');
  room.join('a');
  assert.deepEqual(room.projection('a').players.map((player) => player.seat), ['PLAYER_A']);
  room.join('b');
  assert.deepEqual(room.projection('a').players.map((player) => player.seat), ['PLAYER_A', 'PLAYER_B']);
  room.dispose();
});

test('idempotency cache is scoped per session and clears on rematch', () => {
  const room = new OnlineRoomController('ABCD2', { randomInt: () => 0 });
  room.join('a');
  room.join('b');
  const sharedOperationId = 'shared-op';
  const pickDraft = (session: 'a' | 'b', operationId: string) => {
    const projection = room.projection(session);
    const draft = projection.own.draft;
    const position = draft && 'availablePositions' in draft ? draft.availablePositions[0]!.position : 0;
    room.handle(session, pick(operationId, projection.phase as 'DRAFT_PLAYER_A' | 'DRAFT_PLAYER_B', position));
  };
  const first = room.projection('a').phase === 'DRAFT_PLAYER_A' ? 'a' : 'b';
  pickDraft(first, 'd-a');
  pickDraft(first === 'a' ? 'b' : 'a', 'd-b');
  const lock = (operationId: string, cardId: string) => ({
    type: 'LOCK_CARD',
    operationId,
    expectedPhase: 'ROUND_SELECTION',
    expectedRound: 1,
    payload: { cardId },
  } as const);
  const cardA = room.projection('a').own.hand[0]!.id;
  const cardB = room.projection('b').own.hand[0]!.id;
  const fromA = room.handle('a', lock(sharedOperationId, cardA));
  const fromB = room.handle('b', lock(sharedOperationId, cardB));
  assert.notEqual(fromA.own.lockedCardId, fromB.own.lockedCardId);
  assert.equal(fromA.own.lockedCardId, cardA);
  assert.equal(fromB.own.lockedCardId, cardB);
  assert.equal(room.idempotencySize, 4);
  room.dispose();
});

test('online lock is replaceable, private, deadline-stable, and idempotent until reveal', () => {
  const timer = new FakeTimer();
  const room = new OnlineRoomController('ABCD2', { randomInt: () => 0, timer, now: () => timer.now });
  room.join('a');
  room.join('b');
  const first = room.projection('a');
  const active = first.phase === 'DRAFT_PLAYER_A' ? 'a' : 'b';
  const inactive = active === 'a' ? 'b' : 'a';
  const draftPick = (session: string, id: string) => {
    const projection = room.projection(session);
    const phase = projection.phase as 'DRAFT_PLAYER_A' | 'DRAFT_PLAYER_B';
    const position = projection.own.draft && 'availablePositions' in projection.own.draft ? projection.own.draft.availablePositions[0]!.position : 0;
    room.handle(session, pick(id, phase, position));
  };
  draftPick(active, 'd-1');
  draftPick(inactive, 'd-2');
  const a = room.projection('a');
  const b = room.projection('b');
  const cardA = a.own.hand[0]!.id;
  const replacementA = a.own.hand[1]!.id;
  const cardB = b.own.hand[0]!.id;
  const lock = (operationId: string, cardId: string) => ({ type: 'LOCK_CARD', operationId, expectedPhase: 'ROUND_SELECTION', expectedRound: 1, payload: { cardId } } as const);
  const locked = room.handle('a', lock('lock-a', cardA));
  assert.equal(locked.players.find((player) => player.seat === 'PLAYER_A')?.locked, true);
  assert.equal(locked.own.lockedCardId, cardA);
  assert.equal('hand' in locked.players.find((player) => player.seat === 'PLAYER_B')!, false);
  assert.equal('lockedCardId' in room.projection('b').players.find((player) => player.seat === 'PLAYER_A')!, false);
  const deadlineAt = locked.deadlineAt;

  const same = room.handle('a', lock('lock-a-same', cardA));
  assert.equal(same.own.lockedCardId, cardA);
  assert.equal(same.deadlineAt, deadlineAt);

  const replaced = room.handle('a', lock('lock-a-replace', replacementA));
  assert.equal(replaced.own.lockedCardId, replacementA);
  assert.equal(replaced.deadlineAt, deadlineAt);
  assert.deepEqual(replaced.own.hand.map((card) => card.used), [false, false, false, false]);
  assert.deepEqual(room.handle('a', lock('lock-a-replace', replacementA)), replaced);

  const restored = room.handle('a', lock('lock-a-restore', cardA));
  assert.equal(restored.own.lockedCardId, cardA);
  const preparing = room.handle('b', lock('lock-b', cardB));
  assert.equal(preparing.phase, 'ROUND_REVEAL');
  assert.equal(preparing.lastRound, null);
  assert.equal(preparing.deadlineAt, undefined);
  assert.deepEqual(preparing.players.map((player) => player.score), [0, 0]);
  assert.equal(timer.delayMs, ROUND_PREPARE_MS);
  timer.fire();
  const result = room.projection('b');
  assert.equal(result.phase, 'ROUND_RESULT');
  assert.equal(result.lastRound?.round, 1);
  assert.equal(timer.delayMs, ROUND_PRESENTATION_MS);
  assert.deepEqual(result.players.map((player) => player.discards.length), [1, 1]);
  assert.deepEqual(room.handle('b', lock('lock-b', cardB)), result);
  assert.throws(() => room.handle('b', { ...lock('lock-b', cardB), payload: { cardId: 'different' } }), (error: unknown) => error instanceof ProtocolError && error.code === 'OPERATION_CONFLICT');
  assert.throws(() => room.handle('a', lock('late-replace', replacementA)), (error: unknown) => error instanceof ProtocolError && error.code === 'STALE_OPERATION');
  room.dispose();
});

test('four authoritative rounds finish once and rematch waits for both seats', () => {
  const timer = new FakeTimer();
  const room = new OnlineRoomController('ABCD2', { randomInt: () => 0, timer, now: () => timer.now });
  room.join('a');
  room.join('b');
  const pickDraft = (session: 'a' | 'b', operationId: string) => {
    const projection = room.projection(session);
    const draft = projection.own.draft;
    const position = draft && 'availablePositions' in draft ? draft.availablePositions[0]!.position : 0;
    room.handle(session, pick(operationId, projection.phase as 'DRAFT_PLAYER_A' | 'DRAFT_PLAYER_B', position));
  };
  const first = room.projection('a').phase === 'DRAFT_PLAYER_A' ? 'a' : 'b';
  pickDraft(first, 'draft-a'); pickDraft(first === 'a' ? 'b' : 'a', 'draft-b');
  for (let round = 1; round <= 4; round += 1) {
    const a = room.projection('a');
    const b = room.projection('b');
    const cardA = a.own.hand.find((card) => !card.used)!;
    const cardB = b.own.hand.find((card) => !card.used && resolveRound(cardA.kind as 'ROCK' | 'PAPER' | 'SCISSORS', card.kind as 'ROCK' | 'PAPER' | 'SCISSORS') === 'WIN') ?? b.own.hand.find((card) => !card.used)!;
    room.handle('a', { type: 'LOCK_CARD', operationId: `a-${round}`, expectedPhase: 'ROUND_SELECTION', expectedRound: round, payload: { cardId: cardA.id } });
    const after = room.handle('b', { type: 'LOCK_CARD', operationId: `b-${round}`, expectedPhase: 'ROUND_SELECTION', expectedRound: round, payload: { cardId: cardB.id } });
    assert.equal(after.phase, 'ROUND_REVEAL');
    timer.fire();
    assert.equal(room.projection('a').phase, 'ROUND_RESULT');
    timer.fire();
    assert.equal(room.projection('a').phase, round < 4 ? 'ROUND_SELECTION' : 'MATCH_RESULT');
  }
  const result = room.projection('a');
  assert.equal(result.result?.winner, 'PLAYER_A');
  assert.equal(result.lastRound?.round, 4);
  const readyA = room.handle('a', { type: 'REMATCH_READY', operationId: 'ready-a', expectedPhase: 'MATCH_RESULT', expectedRound: 4, payload: { ready: true } });
  assert.deepEqual(readyA.rematchReady, ['PLAYER_A']);
  const readyB = room.handle('b', { type: 'REMATCH_READY', operationId: 'ready-b', expectedPhase: 'MATCH_RESULT', expectedRound: 4, payload: { ready: true } });
  assert.ok(readyB.phase === 'DRAFT_PLAYER_A' || readyB.phase === 'DRAFT_PLAYER_B');
  assert.notEqual(readyB.matchId, result.matchId);
  assert.ok(readyB.revision! > result.revision!);
  assert.equal(readyB.timeline, null);
  room.dispose();
});

test('disconnect keeps the seat reserved, restores safely, then awards one expiry loss', () => {
  const timer = new FakeTimer();
  const room = new OnlineRoomController('ABCD2', { randomInt: () => 0, timer });
  room.join('a'); room.join('b');
  const token = room.reconnectToken('a');
  room.disconnect('a');
  assert.throws(() => room.handle('a', pick('late', room.projection('b').phase as 'DRAFT_PLAYER_A' | 'DRAFT_PLAYER_B', 0)), (error: unknown) => error instanceof ProtocolError && error.code === 'ROOM_EXPIRED');
  assert.equal(room.reconnect('a', token), 'PLAYER_A');
  room.disconnect('a');
  timer.fire();
  assert.throws(() => room.reconnect('a', token), (error: unknown) => error instanceof ProtocolError && error.code === 'ROOM_EXPIRED');
  const opponent = room.projection('b');
  assert.equal(opponent.phase, 'MATCH_RESULT');
  assert.equal(opponent.result?.winner, 'PLAYER_B');
  timer.fire();
  assert.equal(room.projection('b').result?.winner, 'PLAYER_B');
  room.dispose();
});

test('rate excess action is stable and does not mutate the room', () => {
  let now = 0;
  const room = new OnlineRoomController('ABCD2', { now: () => now, maxMessagesPerSecond: 1 });
  room.join('a'); room.join('b');
  const before = room.projection('a');
  assert.throws(() => room.handle('a', null), (error: unknown) => error instanceof ProtocolError && error.code === 'INVALID_MESSAGE');
  assert.throws(() => room.handle('a', null), (error: unknown) => error instanceof ProtocolError && error.code === 'RATE_LIMITED');
  assert.deepEqual(room.projection('a'), before);
  now = 1_000;
  assert.throws(() => room.handle('a', null), (error: unknown) => error instanceof ProtocolError && error.code === 'INVALID_MESSAGE');
  room.dispose();
});

test('configured draft and round deadlines are used', () => {
  const timer = new FakeTimer();
  const room = new OnlineRoomController('ABCD2', {
    randomInt: () => 0,
    timer,
    draftSelectionTimeoutMs: 3_000,
    roundSelectionTimeoutMs: 12_000,
  });
  room.join('a'); room.join('b');
  assert.equal(timer.delayMs, 3_000);
  const first = room.projection('a').phase === 'DRAFT_PLAYER_A' ? 'a' : 'b';
  const second = first === 'a' ? 'b' : 'a';
  for (const [session, operationId] of [[first, 'd-1'], [second, 'd-2']] as const) {
    const projection = room.projection(session);
    const draft = projection.own.draft;
    const position = draft && 'availablePositions' in draft ? draft.availablePositions[0]!.position : 0;
    room.handle(session, pick(operationId, projection.phase as 'DRAFT_PLAYER_A' | 'DRAFT_PLAYER_B', position));
  }
  assert.equal(timer.delayMs, 12_000);
  room.dispose();
});

test('private room operations require the reconnect token', () => {
  const room = new OnlineRoomController('ABCD2');
  room.join('a');
  assert.doesNotThrow(() => room.authorize('a', room.reconnectToken('a')));
  assert.throws(
    () => room.authorize('a', 'wrong-token'),
    (error: unknown) => error instanceof ProtocolError && error.code === 'ROOM_EXPIRED',
  );
  room.dispose();
});

test('an expired single-player reservation closes the room', () => {
  const timer = new FakeTimer();
  const room = new OnlineRoomController('ABCD2', { timer });
  room.join('a');
  room.disconnect('a');
  timer.fire();
  assert.equal(room.isClosed, true);
  assert.throws(
    () => room.join('b'),
    (error: unknown) => error instanceof ProtocolError && error.code === 'ROOM_EXPIRED',
  );
  room.dispose();
});

test('authenticated polling expires an inactive opponent after the reconnect window', () => {
  let now = 0;
  const room = new OnlineRoomController('ABCD2', { now: () => now, reconnectTimeoutMs: 25_000 });
  room.join('a'); room.join('b');
  const tokenA = room.reconnectToken('a');
  const tokenB = room.reconnectToken('b');
  room.authorize('a', tokenA);
  room.authorize('b', tokenB);
  now = 20_000;
  room.authorize('b', tokenB);
  now = 25_001;
  room.authorize('b', tokenB);
  assert.equal(room.projection('b').result?.winner, 'PLAYER_B');
  assert.throws(
    () => room.reconnect('a', tokenA),
    (error: unknown) => error instanceof ProtocolError && error.code === 'ROOM_EXPIRED',
  );
  room.dispose();
});

test('explicit leave closes the room and awards the connected opponent once', () => {
  const room = new OnlineRoomController('ABCD2');
  room.join('a'); room.join('b');
  room.leave('a');
  assert.equal(room.isClosed, true);
  assert.equal(room.projection('b').result?.winner, 'PLAYER_B');
  assert.throws(
    () => room.join('c'),
    (error: unknown) => error instanceof ProtocolError && error.code === 'ROOM_EXPIRED',
  );
  room.dispose();
});

test('prepare/result cleanup cancels stale callbacks and late timer catches up on the same timeline', () => {
  for (const phase of ['prepare', 'result', 'late'] as const) {
    const timer = new FakeTimer();
    const room = new OnlineRoomController('ABCD2', { randomInt: () => 0, timer, now: () => timer.now });
    room.join('a'); room.join('b');
    timer.fire(); timer.fire();
    const a = room.projection('a'); const b = room.projection('b');
    const lock = (id: string) => ({ type: 'LOCK_CARD', operationId: id, expectedPhase: 'ROUND_SELECTION', expectedRound: 1, payload: { cardId: id } } as const);
    room.handle('a', lock(a.own.hand[0]!.id));
    const before = room.handle('b', lock(b.own.hand[0]!.id));
    assert.equal(before.phase, 'ROUND_REVEAL');
    const revision = before.revision!;
    if (phase === 'late') {
      timer.now = before.timeline!.completeAt;
      timer.fire();
      assert.equal(timer.delayMs, 0);
      timer.fire();
      const after = room.projection('a');
      assert.equal(after.phase, 'ROUND_SELECTION');
      assert.equal(after.round, 2);
      assert.ok(after.revision! > revision);
      assert.equal(after.deadlineAt, timer.now + 15_000);
      assert.equal(after.timeline?.round, 1);
      room.dispose();
    } else {
      if (phase === 'result') timer.fire();
      room.leave('a');
      assert.equal(room.projection('b').timeline, null);
      timer.fire();
      assert.equal(room.projection('b').phase, 'MATCH_RESULT');
      assert.equal(room.projection('b').result?.winner, 'PLAYER_B');
      room.dispose();
      assert.equal(timer.callback, null);
    }
  }
});
