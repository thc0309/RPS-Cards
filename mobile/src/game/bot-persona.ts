import type { CardInstance, CardKind, PlayedCard, RandomInt } from '@rps-cards/game-core';

/**
 * BOT personas trade randomness for a readable habit, so a player who pays
 * attention can win more often. Every persona only sees public information:
 * its own hand and the cards already revealed. It never sees the pending lock.
 */
export type BotPersonaId = 'opener' | 'keeper' | 'counter' | 'mimic';

export const BOT_PERSONAS: readonly BotPersonaId[] = ['opener', 'keeper', 'counter', 'mimic'];

/** Chance (in percent) that a persona follows its habit instead of picking at random. */
export const BOT_HABIT_PERCENT = 75;

const BEATS: Record<CardKind, CardKind> = { ROCK: 'PAPER', PAPER: 'SCISSORS', SCISSORS: 'ROCK' };

export interface BotView {
  readonly hand: readonly CardInstance[];
  /** Cards the human player has revealed so far, in round order. */
  readonly opponentPlayed: readonly PlayedCard[];
}

export function pickBotPersona(randomInt: RandomInt): BotPersonaId {
  return BOT_PERSONAS[randomInt(BOT_PERSONAS.length)] ?? 'opener';
}

function duplicateKind(hand: readonly CardInstance[]): CardKind | null {
  const seen = new Set<CardKind>();
  for (const card of hand) {
    if (seen.has(card.kind)) return card.kind;
    seen.add(card.kind);
  }
  return null;
}

function habitChoices(persona: BotPersonaId, view: BotView): readonly CardInstance[] {
  const available = view.hand.filter((card) => !card.used);
  const pair = duplicateKind(available);
  const last = view.opponentPlayed[view.opponentPlayed.length - 1]?.kind;
  switch (persona) {
    // Shows its doubled card as early as possible.
    case 'opener': return pair ? available.filter((card) => card.kind === pair) : [];
    // Holds the doubled card back until nothing else is left.
    case 'keeper': return pair ? available.filter((card) => card.kind !== pair) : [];
    // Answers the card the player showed last round.
    case 'counter': return last ? available.filter((card) => card.kind === BEATS[last]) : [];
    // Copies the card the player showed last round.
    case 'mimic': return last ? available.filter((card) => card.kind === last) : [];
  }
}

export function chooseBotCard(persona: BotPersonaId, view: BotView, randomInt: RandomInt): CardInstance | null {
  const available = view.hand.filter((card) => !card.used);
  if (available.length === 0) return null;
  const preferred = habitChoices(persona, view);
  if (preferred.length > 0 && randomInt(100) < BOT_HABIT_PERCENT) return preferred[randomInt(preferred.length)] ?? null;
  return available[randomInt(available.length)] ?? null;
}
