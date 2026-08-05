import { LocalBotDraftAdapter, DRAFT_TIMEOUT_MS, type TimerApi } from './local-bot-adapter';

class FakeTimer implements TimerApi {
  now = 1_000;
  private nextId = 0;
  private tasks = new Map<number, () => void>();
  setTimeout(callback: () => void): number { const id = this.nextId++; this.tasks.set(id, callback); return id; }
  clearTimeout(handle: unknown): void { this.tasks.delete(handle as number); }
  advance(ms: number): void { this.now += ms; const tasks = [...this.tasks.values()]; this.tasks.clear(); tasks.forEach((task) => task()); }
}

function queued(values: number[]) {
  return (maxExclusive: number) => {
    const value = values.shift() ?? 0;
    return value % maxExclusive;
  };
}

test('supports player-first and player-second draft flows with four-card hands', () => {
  const first = new LocalBotDraftAdapter(queued([0, 0, 0, 0, 0]), { now: () => 1_000, timer: new FakeTimer() });
  expect(first.getState().status).toBe('AVAILABLE');
  first.selectPlayerPosition(0);
  expect(first.getState().status).toBe('COMPLETE');
  expect(first.getState().result?.hands.PLAYER_A).toHaveLength(4);

  const second = new LocalBotDraftAdapter(queued([1, 0, 0, 0, 0]), { now: () => 1_000, timer: new FakeTimer() });
  expect(second.getState().status).toBe('AVAILABLE');
  second.selectPlayerPosition(0);
  expect(second.getState().status).toBe('COMPLETE');
  expect(second.getState().result?.hands.PLAYER_B).toHaveLength(4);
});

test('deadline and tap race accept exactly one player operation', () => {
  const timer = new FakeTimer();
  const adapter = new LocalBotDraftAdapter(queued([0, 0, 0, 0, 0]), { now: () => timer.now, timer });
  adapter.selectPlayerPosition(0);
  const operationsAfterTap = adapter.getState().acceptedOperations;
  timer.advance(DRAFT_TIMEOUT_MS);
  expect(adapter.getState().acceptedOperations).toBe(operationsAfterTap);
  expect(adapter.getState().status).toBe('COMPLETE');
  adapter.dispose();
});

test('timeout selects a legal position and exposes no inactive secret fields', () => {
  const timer = new FakeTimer();
  const adapter = new LocalBotDraftAdapter(queued([0, 0, 0, 0, 0]), { now: () => timer.now, timer });
  expect(adapter.getState().view).not.toHaveProperty('selectedCard');
  timer.advance(DRAFT_TIMEOUT_MS);
  expect(adapter.getState().status).toBe('COMPLETE');
  adapter.dispose();
});
