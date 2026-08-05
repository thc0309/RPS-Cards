import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  completeDraft,
  createDraft,
  getDraftView,
  pickDraft,
  timeoutPickDraft,
} from './index.js';
import type { PlayerId } from './index.js';

function queued(values: number[]): (maxExclusive: number) => number {
  return (maxExclusive) => {
    const value = values.shift();
    assert.notEqual(value, undefined);
    assert.ok(value! >= 0 && value! < maxExclusive);
    return value!;
  };
}

describe('sequential private draft', () => {
  it('reindexes remaining positions and hides inactive secrets', () => {
    const state = createDraft(queued([0, 0, 1]));
    assert.equal(state.firstDrafter, 'PLAYER_A');
    assert.equal(state.phase, 'DRAFT_PLAYER_A');

    const beforePick = getDraftView(state, 'PLAYER_B');
    assert.equal(beforePick.opponentHasPicked, false);
    assert.equal('selectedPosition' in beforePick, false);
    assert.equal('selectedCard' in beforePick, false);

    const afterFirst = pickDraft(state, 'PLAYER_A', 1);
    assert.equal(afterFirst.phase, 'DRAFT_PLAYER_B');
    assert.deepEqual(afterFirst.availablePositions.map((item) => item.position), [0, 1]);

    const inactive = getDraftView(afterFirst, 'PLAYER_B');
    assert.equal(inactive.opponentHasPicked, true);
    assert.equal('selectedPosition' in inactive, false);
    assert.equal('selectedCard' in inactive, false);

    const afterSecond = timeoutPickDraft(afterFirst, 'PLAYER_B', () => 0);
    assert.equal(afterSecond.phase, 'DRAFT_COMPLETE');
    const result = completeDraft(afterSecond);
    assert.equal(result.hands.PLAYER_A.length, 4);
    assert.equal(result.hands.PLAYER_B.length, 4);
    assert.notEqual(result.extraCards.PLAYER_A, result.extraCards.PLAYER_B);
    assert.notEqual(result.extraCards.PLAYER_A, result.removedCard);
    assert.notEqual(result.extraCards.PLAYER_B, result.removedCard);
  });

  it('rejects duplicate positions, wrong turns and illegal timeout picks', () => {
    const state = createDraft(queued([1, 0, 0]));
    const wrongPlayer: PlayerId = state.firstDrafter === 'PLAYER_A' ? 'PLAYER_B' : 'PLAYER_A';
    assert.throws(() => pickDraft(state, wrongPlayer, 0), /INVALID_DRAFT_TURN/);
    const first = pickDraft(state, state.firstDrafter, 0);
    assert.throws(() => pickDraft(first, state.firstDrafter, 0), /INVALID_DRAFT_TURN/);
    assert.throws(() => timeoutPickDraft(first, first.currentPlayerId!, () => 2), /RNG_OUT_OF_RANGE/);
    assert.throws(() => pickDraft(first, first.currentPlayerId!, 2), /DRAFT_POSITION_UNAVAILABLE/);
  });
});
