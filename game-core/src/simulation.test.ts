import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { beginNextRound, completeDraft, createDraft, createMatch, lockCard, pickDraft, resolveLockedRound } from './index.js';
import { resolveRound } from './rules.js';
import type { CardInstance, CardKind, PlayerId } from './index.js';

const kinds: CardKind[] = ['ROCK', 'PAPER', 'SCISSORS'];
const extraPairings: readonly (readonly [CardKind, CardKind])[] = [
  ['ROCK', 'PAPER'], ['ROCK', 'SCISSORS'], ['PAPER', 'ROCK'],
  ['PAPER', 'SCISSORS'], ['SCISSORS', 'ROCK'], ['SCISSORS', 'PAPER'],
];

function permutations<T>(items: readonly T[]): T[][] {
  if (items.length === 0) return [[]];
  const result: T[][] = [];
  for (const [index, item] of items.entries()) {
    for (const rest of permutations([...items.slice(0, index), ...items.slice(index + 1)])) {
      result.push([item, ...rest]);
    }
  }
  return result;
}

function score(orderA: readonly CardKind[], orderB: readonly CardKind[]): [number, number] {
  let scoreA = 0;
  let scoreB = 0;
  for (let index = 0; index < 4; index += 1) {
    const outcome = resolveRound(orderA[index]!, orderB[index]!);
    if (outcome === 'WIN') scoreA += 1;
    if (outcome === 'LOSS') scoreB += 1;
  }
  return [scoreA, scoreB];
}

function hands(extraA: CardKind, extraB: CardKind): Record<PlayerId, CardInstance[]> {
  return {
    PLAYER_A: [...kinds, extraA].map((kind, index) => ({ id: `a${index}`, kind, owner: 'PLAYER_A', used: false })),
    PLAYER_B: [...kinds, extraB].map((kind, index) => ({ id: `b${index}`, kind, owner: 'PLAYER_B', used: false })),
  };
}

function play(state: ReturnType<typeof createMatch>, orderA: readonly number[], orderB: readonly number[]) {
  return playIds(state, orderA.map((index) => `a${index}`), orderB.map((index) => `b${index}`));
}

function playIds(state: ReturnType<typeof createMatch>, idsA: readonly string[], idsB: readonly string[]) {
  let next = state;
  for (let round = 0; round < 4; round += 1) {
    next = resolveLockedRound(lockCard(lockCard(next, 'PLAYER_A', idsA[round]!), 'PLAYER_B', idsB[round]!));
    if (round < 3) next = beginNextRound(next);
  }
  return next;
}

function seeded(seed: number): (maxExclusive: number) => number {
  let value = seed >>> 0;
  return (maxExclusive) => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value % maxExclusive;
  };
}

function simulation(seed: number) {
  const draft = createDraft(seeded(seed));
  const first = draft.firstDrafter;
  const picked = draft.availablePositions[seed % 3]!;
  const afterFirst = (first === 'PLAYER_A'
    ? lockDraft(draft, 'PLAYER_A', picked.position)
    : lockDraft(draft, 'PLAYER_B', picked.position));
  const second = afterFirst.currentPlayerId!;
  const afterSecond = lockDraft(afterFirst, second, 0);
  const draftResult = completeDraft(afterSecond);
  const state = createMatch(draftResult.hands);
  const idsA = draftResult.hands.PLAYER_A.map((item) => item.id);
  const idsB = draftResult.hands.PLAYER_B.map((item) => item.id).reverse();
  const result = playIds(state, idsA, idsB);
  assert.equal(result.phase, 'MATCH_RESULT');
  assert.equal(result.discards.length, 8);
  assert.equal(new Set(result.discards.map((item) => item.cardId)).size, 8);
  assert.equal(result.players.PLAYER_A.cards.filter((item) => item.used).length, 4);
  assert.equal(result.players.PLAYER_B.cards.filter((item) => item.used).length, 4);
  return {
    winner: result.result!.winner,
    extraCards: draftResult.extraCards,
    discards: result.discards.map((item) => item.cardId),
  };
}

function lockDraft(state: ReturnType<typeof createDraft>, playerId: PlayerId, position: number) {
  return pickDraft(state, playerId, position);
}

describe('exhaustive and deterministic simulation gates', () => {
  it('runs 864 non-tied ordered play cases across six extra-card pairings', () => {
    const orders = permutations([0, 1, 2, 3]);
    let cases = 0;
    for (const [extraA, extraB] of extraPairings) {
      const validPairs: [number[], number[]][] = [];
      for (const orderA of orders) {
        for (const orderB of orders) {
          const kindsA = orderA.map((index) => [...kinds, extraA][index]!);
          const kindsB = orderB.map((index) => [...kinds, extraB][index]!);
          const [scoreA, scoreB] = score(kindsA, kindsB);
          if (scoreA !== scoreB) validPairs.push([orderA, orderB]);
        }
      }
      assert.ok(validPairs.length >= 144);
      for (const [orderA, orderB] of validPairs.slice(0, 144)) {
        const result = play(createMatch(hands(extraA, extraB)), orderA, orderB);
        assert.equal(result.phase, 'MATCH_RESULT');
        assert.notEqual(result.players.PLAYER_A.score, result.players.PLAYER_B.score);
        cases += 1;
      }
    }
    assert.equal(cases, 864);
  });

  it('completes 10,000 deterministic matches and replays the same seed', () => {
    const first = simulation(42);
    assert.deepEqual(simulation(42), first);
    for (let seed = 0; seed < 10_000; seed += 1) simulation(seed);
  });
});
