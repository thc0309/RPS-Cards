import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveRound } from './rules.js';
import type { CardKind } from './types.js';

const kinds: CardKind[] = ['ROCK', 'PAPER', 'SCISSORS'];

describe('resolveRound', () => {
  it('covers every ordered matchup and its reciprocal', () => {
    const expected: Record<CardKind, Record<CardKind, 'WIN' | 'LOSS' | 'DRAW'>> = {
      ROCK: { ROCK: 'DRAW', PAPER: 'LOSS', SCISSORS: 'WIN' },
      PAPER: { ROCK: 'WIN', PAPER: 'DRAW', SCISSORS: 'LOSS' },
      SCISSORS: { ROCK: 'LOSS', PAPER: 'WIN', SCISSORS: 'DRAW' },
    };

    for (const mine of kinds) {
      for (const theirs of kinds) {
        const outcome = resolveRound(mine, theirs);
        assert.equal(outcome, expected[mine][theirs]!);
        assert.equal(
          resolveRound(theirs, mine),
          outcome === 'WIN' ? 'LOSS' : outcome === 'LOSS' ? 'WIN' : 'DRAW',
        );
      }
    }
  });
});
