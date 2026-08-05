import type { CardKind, RoundOutcome } from './types.js';

export function resolveRound(mine: CardKind, theirs: CardKind): RoundOutcome {
  if (mine === theirs) return 'DRAW';
  return (
    (mine === 'ROCK' && theirs === 'SCISSORS') ||
    (mine === 'PAPER' && theirs === 'ROCK') ||
    (mine === 'SCISSORS' && theirs === 'PAPER')
  ) ? 'WIN' : 'LOSS';
}
