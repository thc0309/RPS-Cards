import type { CardInstance, CardKind } from '@rps-cards/game-core';
import { BOT_PERSONAS, chooseBotCard, pickBotPersona } from './bot-persona';

function hand(kinds: readonly CardKind[], used: readonly number[] = []): CardInstance[] {
  return kinds.map((kind, index) => ({ id: `b${index}`, kind, owner: 'PLAYER_B', used: used.includes(index) }));
}

const always = (value: number) => () => value;
const played = (kind: CardKind) => [{ playerId: 'PLAYER_A' as const, cardId: 'a0', kind }];

test('opener leads with its doubled card and keeper holds it back', () => {
  const cards = hand(['ROCK', 'PAPER', 'SCISSORS', 'PAPER']);
  expect(chooseBotCard('opener', { hand: cards, opponentPlayed: [] }, always(0))?.kind).toBe('PAPER');
  expect(chooseBotCard('keeper', { hand: cards, opponentPlayed: [] }, always(0))?.kind).toBe('ROCK');
});

test('counter beats and mimic copies the last revealed player card', () => {
  const cards = hand(['ROCK', 'PAPER', 'SCISSORS', 'ROCK']);
  expect(chooseBotCard('counter', { hand: cards, opponentPlayed: played('SCISSORS') }, always(0))?.kind).toBe('ROCK');
  expect(chooseBotCard('mimic', { hand: cards, opponentPlayed: played('PAPER') }, always(0))?.kind).toBe('PAPER');
});

test('every persona only returns an unused card and falls back to any card', () => {
  const cards = hand(['ROCK', 'PAPER', 'SCISSORS', 'ROCK'], [0, 1, 3]);
  for (const persona of BOT_PERSONAS) {
    expect(chooseBotCard(persona, { hand: cards, opponentPlayed: played('ROCK') }, always(0))?.id).toBe('b2');
  }
  expect(chooseBotCard('opener', { hand: hand(['ROCK'], [0]), opponentPlayed: [] }, always(0))).toBeNull();
});

test('a failed habit roll plays any available card', () => {
  const cards = hand(['ROCK', 'PAPER', 'SCISSORS', 'PAPER']);
  const rolls = [99, 2];
  expect(chooseBotCard('opener', { hand: cards, opponentPlayed: [] }, () => rolls.shift() ?? 0)?.kind).toBe('SCISSORS');
});

test('persona selection is driven by the injected random source', () => {
  expect(BOT_PERSONAS.map((_, index) => pickBotPersona(always(index)))).toEqual([...BOT_PERSONAS]);
});
