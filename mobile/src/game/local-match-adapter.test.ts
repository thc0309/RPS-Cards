import type { CardInstance, CardKind } from '@rps-cards/game-core';
import { LocalMatchAdapter, ROUND_TIMEOUT_MS, type MatchTimerApi } from './local-match-adapter';

class FakeTimer implements MatchTimerApi {
  now = 10_000;
  private nextId = 0;
  private tasks = new Map<number, () => void>();
  setTimeout(callback: () => void): number { const id = this.nextId++; this.tasks.set(id, callback); return id; }
  clearTimeout(handle: unknown): void { this.tasks.delete(handle as number); }
  advance(ms: number): void { this.now += ms; const tasks = [...this.tasks.values()]; this.tasks.clear(); tasks.forEach((task) => task()); }
}

function hands(): Record<'PLAYER_A' | 'PLAYER_B', CardInstance[]> {
  const kinds: CardKind[] = ['ROCK', 'PAPER', 'SCISSORS', 'ROCK'];
  return {
    PLAYER_A: kinds.map((kind, index) => ({ id: `a${index}`, kind, owner: 'PLAYER_A', used: false })),
    PLAYER_B: kinds.map((kind, index) => ({ id: `b${index}`, kind: index === 0 ? 'SCISSORS' : kind, owner: 'PLAYER_B', used: false })),
  };
}

test('locks manually and resolves only once at the deadline race', () => {
  const timer = new FakeTimer();
  const adapter = new LocalMatchAdapter(hands(), () => 0, { now: () => timer.now, timer });
  for (const cardId of ['a0', 'a1', 'a2', 'a3']) adapter.lockPlayerCard(cardId);
  expect(adapter.getState().match.phase).toBe('MATCH_RESULT');
  expect(adapter.getState().match.discards).toHaveLength(8);
  const operations = adapter.getState().acceptedOperations;
  timer.advance(ROUND_TIMEOUT_MS);
  expect(adapter.getState().acceptedOperations).toBe(operations);
  adapter.dispose();
});

test('timeout auto-locks a legal unused card', () => {
  const timer = new FakeTimer();
  const adapter = new LocalMatchAdapter(hands(), () => 0, { now: () => timer.now, timer });
  timer.advance(ROUND_TIMEOUT_MS);
  expect(adapter.getState().match.discards).toHaveLength(2);
  adapter.dispose();
});

test('runs exactly four rounds, then rematch resets to round one', () => {
  const adapter = new LocalMatchAdapter(hands(), () => 0);
  for (const cardId of ['a0', 'a1', 'a2', 'a3']) adapter.lockPlayerCard(cardId);
  expect(adapter.getState().match.phase).toBe('MATCH_RESULT');
  expect(adapter.getState().match.discards).toHaveLength(8);
  adapter.rematch();
  expect(adapter.getState().match.phase).toBe('ROUND_SELECTION');
  expect(adapter.getState().match.round).toBe(1);
  expect(adapter.getState().match.discards).toHaveLength(0);
  adapter.dispose();
});
