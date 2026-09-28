import type { CardInstance, CardKind } from '@rps-cards/game-core';
import { BOT_THINK_DELAY_MS, LocalMatchAdapter, ROUND_TIMEOUT_MS, type MatchTimerApi } from './local-match-adapter';

class FakeTimer implements MatchTimerApi {
  now = 10_000;
  private nextId = 0;
  private tasks = new Map<number, { at: number; callback: () => void }>();
  setTimeout(callback: () => void, delayMs: number): number { const id = this.nextId++; this.tasks.set(id, { at: this.now + delayMs, callback }); return id; }
  clearTimeout(handle: unknown): void { this.tasks.delete(handle as number); }
  advance(ms: number): void {
    this.now += ms;
    for (const [id, task] of [...this.tasks].sort((a, b) => a[1].at - b[1].at)) {
      if (task.at <= this.now && this.tasks.delete(id)) task.callback();
    }
  }
  pendingAt(): number[] { return [...this.tasks.values()].map((task) => task.at).sort((a, b) => a - b); }
}

function hands(): Record<'PLAYER_A' | 'PLAYER_B', CardInstance[]> {
  const kinds: CardKind[] = ['ROCK', 'PAPER', 'SCISSORS', 'ROCK'];
  return {
    PLAYER_A: kinds.map((kind, index) => ({ id: `a${index}`, kind, owner: 'PLAYER_A', used: false })),
    PLAYER_B: kinds.map((kind, index) => ({ id: `b${index}`, kind: index === 0 ? 'SCISSORS' : kind, owner: 'PLAYER_B', used: false })),
  };
}

test('replaces A to B to A without moving the bot or round deadlines', () => {
  const timer = new FakeTimer();
  const adapter = new LocalMatchAdapter(hands(), () => 0, { now: () => timer.now, timer });
  const deadlineAt = adapter.getState().deadline?.deadlineAt;
  adapter.lockPlayerCard('a0');
  expect(timer.pendingAt()).toEqual([10_000 + BOT_THINK_DELAY_MS, deadlineAt]);
  timer.advance(500);
  adapter.lockPlayerCard('a1');
  expect(adapter.getState().match.players.PLAYER_A.lockedCardId).toBe('a1');
  expect(timer.pendingAt()).toEqual([10_000 + BOT_THINK_DELAY_MS, deadlineAt]);
  timer.advance(500);
  adapter.lockPlayerCard('a0');
  expect(timer.pendingAt()).toEqual([10_000 + BOT_THINK_DELAY_MS, deadlineAt]);
  timer.advance(1_000);
  expect(adapter.getState().match.discards.map((card) => card.cardId)).toEqual(['a0', 'b0']);
  expect(adapter.getState().match.players.PLAYER_A.cards.find((card) => card.id === 'a1')?.used).toBe(false);
  adapter.dispose();
  expect(timer.pendingAt()).toEqual([]);
});

test('timeout auto-locks a legal unused card', () => {
  const timer = new FakeTimer();
  const adapter = new LocalMatchAdapter(hands(), () => 0, { now: () => timer.now, timer });
  timer.advance(ROUND_TIMEOUT_MS);
  expect(adapter.getState().match.discards).toHaveLength(2);
  expect(adapter.getState().match.discards.map((card) => card.cardId)).toEqual(['a0', 'b0']);
  adapter.dispose();
});

test('runs exactly four rounds, then rematch resets timers to round one', () => {
  const timer = new FakeTimer();
  const adapter = new LocalMatchAdapter(hands(), () => 0, { now: () => timer.now, timer });
  for (const cardId of ['a0', 'a1', 'a2', 'a3']) {
    adapter.lockPlayerCard(cardId);
    timer.advance(BOT_THINK_DELAY_MS);
  }
  expect(adapter.getState().match.phase).toBe('MATCH_RESULT');
  expect(adapter.getState().match.discards).toHaveLength(8);
  expect(timer.pendingAt()).toEqual([]);
  adapter.rematch();
  expect(adapter.getState().match.phase).toBe('ROUND_SELECTION');
  expect(adapter.getState().match.round).toBe(1);
  expect(adapter.getState().match.discards).toHaveLength(0);
  expect(timer.pendingAt()).toEqual([timer.now + ROUND_TIMEOUT_MS]);
  adapter.dispose();
  expect(timer.pendingAt()).toEqual([]);
});
