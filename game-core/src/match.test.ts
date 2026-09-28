import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GameRuleError,
  beginNextRound,
  createMatch,
  lockCard,
  resolveLockedRound,
} from './index.js';
import type { CardInstance, CardKind, MatchState, PlayerId } from './index.js';

function card(id: string, kind: CardKind, owner: PlayerId): CardInstance {
  return { id, kind, owner, used: false };
}

function hands(): Record<PlayerId, CardInstance[]> {
  return {
    PLAYER_A: [
      card('a1', 'ROCK', 'PLAYER_A'),
      card('a2', 'PAPER', 'PLAYER_A'),
      card('a3', 'SCISSORS', 'PLAYER_A'),
      card('a4', 'ROCK', 'PLAYER_A'),
    ],
    PLAYER_B: [
      card('b1', 'SCISSORS', 'PLAYER_B'),
      card('b2', 'ROCK', 'PLAYER_B'),
      card('b3', 'PAPER', 'PLAYER_B'),
      card('b4', 'SCISSORS', 'PLAYER_B'),
    ],
  };
}

function expectCode(action: () => unknown, code: GameRuleError['code']): void {
  assert.throws(action, (error: unknown) => error instanceof GameRuleError && error.code === code);
}

function playRound(state: MatchState, cardA: string, cardB: string): MatchState {
  return resolveLockedRound(lockCard(lockCard(state, 'PLAYER_A', cardA), 'PLAYER_B', cardB));
}

describe('match state', () => {
  it('creates owned unused cards and only reveals after both locks', () => {
    const state = createMatch(hands());
    assert.equal(state.phase, 'ROUND_SELECTION');
    assert.equal(state.round, 1);
    assert.deepEqual(state.players.PLAYER_A.cards.map((item) => item.used), [false, false, false, false]);

    const afterA = lockCard(state, 'PLAYER_A', 'a1');
    assert.equal(afterA.phase, 'ROUND_SELECTION');
    assert.equal(afterA.players.PLAYER_A.lockedCardId, 'a1');
    assert.equal(afterA.players.PLAYER_B.lockedCardId, null);
    assert.equal(state.players.PLAYER_A.lockedCardId, null);

    const revealed = lockCard(afterA, 'PLAYER_B', 'b1');
    assert.equal(revealed.phase, 'ROUND_REVEAL');
    assert.equal(revealed.players.PLAYER_A.score, 0);
    assert.deepEqual(revealed.discards, []);
  });

  it('replaces a locked card until reveal without consuming either card', () => {
    const state = createMatch(hands());
    expectCode(() => lockCard(state, 'PLAYER_A', 'b1'), 'CARD_NOT_OWNED');
    expectCode(() => lockCard(state, 'PLAYER_A', 'missing'), 'CARD_NOT_FOUND');

    const lockedA = lockCard(state, 'PLAYER_A', 'a1');
    assert.equal(lockCard(lockedA, 'PLAYER_A', 'a1'), lockedA);

    const lockedB = lockCard(lockedA, 'PLAYER_A', 'a2');
    assert.equal(lockedB.players.PLAYER_A.lockedCardId, 'a2');
    assert.deepEqual(lockedB.players.PLAYER_A.cards.map((card) => card.used), [false, false, false, false]);

    const restoredA = lockCard(lockedB, 'PLAYER_A', 'a1');
    assert.equal(restoredA.players.PLAYER_A.lockedCardId, 'a1');
    const result = resolveLockedRound(lockCard(restoredA, 'PLAYER_B', 'b1'));
    expectCode(() => lockCard(result, 'PLAYER_A', 'a1'), 'INVALID_PHASE');

    const next = beginNextRound(result);
    expectCode(() => lockCard(next, 'PLAYER_A', 'a1'), 'CARD_ALREADY_USED');
  });

  it('preserves play-order discards and ends exactly after four rounds', () => {
    let state = createMatch(hands());
    state = playRound(state, 'a1', 'b1');
    assert.equal(state.phase, 'ROUND_RESULT');
    assert.equal(state.players.PLAYER_A.score, 1);
    assert.deepEqual(state.discards.map((item) => item.cardId), ['a1', 'b1']);

    state = beginNextRound(state);
    state = playRound(state, 'a2', 'b2');
    state = beginNextRound(state);
    state = playRound(state, 'a3', 'b3');
    state = beginNextRound(state);
    state = playRound(state, 'a4', 'b4');

    assert.equal(state.phase, 'MATCH_RESULT');
    assert.equal(state.round, 4);
    assert.deepEqual(state.result, { winner: 'PLAYER_A', scores: { PLAYER_A: 4, PLAYER_B: 0 } });
    assert.deepEqual(state.discards.map((item) => item.cardId), ['a1', 'b1', 'a2', 'b2', 'a3', 'b3', 'a4', 'b4']);
    assert.equal(state.rulesetVersion, 'classic_v1');
    expectCode(() => beginNextRound(state), 'INVALID_PHASE');
  });
});
