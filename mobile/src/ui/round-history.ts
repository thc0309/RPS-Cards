import type { CardKind } from '@rps-cards/game-core';

export type RoundHistoryRow = {
  readonly round: number;
  readonly local: CardKind;
  readonly opponent: CardKind;
};

export function pairRoundHistory(local: readonly CardKind[], opponent: readonly CardKind[]): readonly RoundHistoryRow[] {
  return local.slice(0, 4).flatMap((card, index) => opponent[index] ? [{ round: index + 1, local: card, opponent: opponent[index] }] : []);
}
