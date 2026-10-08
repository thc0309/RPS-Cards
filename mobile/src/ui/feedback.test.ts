import { createFeedbackRuntime, type FeedbackCue, type FeedbackPlayer } from './feedback';

jest.mock('expo-audio', () => ({ createAudioPlayer: jest.fn(), setAudioModeAsync: jest.fn() }));
jest.mock('../store/app-store', () => ({ useAppStore: { getState: jest.fn(), subscribe: jest.fn() } }));

function harness(loaded = true) {
  const players = new Map<FeedbackCue, FeedbackPlayer & { play: jest.Mock; pause: jest.Mock; remove: jest.Mock; seekTo: jest.Mock; emit: (status: { isLoaded: boolean; didJustFinish?: boolean }) => void; removed: jest.Mock }>();
  const vibrate = jest.fn();
  const runtime = createFeedbackRuntime({
    createPlayer: (cue) => {
      let listener: (status: { isLoaded: boolean; didJustFinish?: boolean }) => void = () => {};
      const removed = jest.fn();
      const player = { isLoaded: loaded, play: jest.fn(), pause: jest.fn(), remove: jest.fn(), seekTo: jest.fn().mockResolvedValue(undefined), removed,
        addListener: (_event: 'playbackStatusUpdate', callback: typeof listener) => { listener = callback; return { remove: removed }; },
        emit: (status: { isLoaded: boolean; didJustFinish?: boolean }) => { player.isLoaded = status.isLoaded; listener(status); },
      };
      players.set(cue, player);
      return player;
    },
    setAudioMode: jest.fn().mockResolvedValue(undefined), vibrate, cancelVibration: jest.fn(),
  });
  runtime.setPreferences({ hasHydrated: true, soundEnabled: true, vibrationEnabled: false });
  return { runtime, players, vibrate };
}

async function flush() { for (let i = 0; i < 8; i += 1) await Promise.resolve(); }
beforeEach(() => { jest.useFakeTimers(); });
afterEach(() => { jest.useRealTimers(); });

test('mute cancels a pending load; enabling sound never replays it', async () => {
  const { runtime, players } = harness(false);
  runtime.play('card-flip');
  runtime.setPreferences({ hasHydrated: true, soundEnabled: false, vibrationEnabled: false });
  players.get('card-flip')!.emit({ isLoaded: true });
  runtime.setPreferences({ hasHydrated: true, soundEnabled: true, vibrationEnabled: false });
  await flush();
  expect(players.get('card-flip')!.play).not.toHaveBeenCalled();
  runtime.dispose();
});

test('background and scope cancellation invalidate completion after seek', async () => {
  const { runtime, players } = harness();
  runtime.play('card-flip', { scope: 'board' });
  let resolve!: () => void;
  players.get('card-flip')!.seekTo.mockImplementation(() => new Promise<void>((done) => { resolve = done; }));
  await flush();
  runtime.setForeground(false);
  runtime.setForeground(true);
  resolve(); await flush();
  expect(players.get('card-flip')!.play).not.toHaveBeenCalled();
  runtime.play('paper-select', { scope: 'board' });
  runtime.cancelScope('board'); await flush();
  expect(players.get('paper-select')!.play).not.toHaveBeenCalled();
  runtime.dispose();
});

test('gameplay preempts taps and blocks low priority ticks without a backlog', async () => {
  const { runtime, players } = harness();
  runtime.play('ui-tap'); await flush();
  runtime.play('round-win'); await flush();
  expect(players.get('ui-tap')!.pause).toHaveBeenCalled();
  runtime.play('tick'); await flush();
  expect(players.get('tick')!.play).not.toHaveBeenCalled();
  expect(players.get('round-win')!.play).toHaveBeenCalledTimes(1);
  players.get('round-win')!.emit({ isLoaded: true, didJustFinish: true });
  await flush();
  expect(players.get('tick')!.play).not.toHaveBeenCalled();
  runtime.dispose();
});

test('terminal record survives source cancellation and consumes once before async play', async () => {
  const { runtime, players } = harness(false);
  runtime.observeMatch({ matchId: 'm1', phase: 'ROUND_RESULT', synced: true });
  runtime.observeMatch({ matchId: 'm1', phase: 'MATCH_RESULT', cue: 'match-win', synced: true });
  runtime.cancelScope('board');
  expect(runtime.consumeTerminal('m1', 'result')).toBe('match-win');
  expect(runtime.consumeTerminal('m1', 'result')).toBeNull();
  players.get('match-win')!.emit({ isLoaded: true }); await flush();
  expect(players.get('match-win')!.play).toHaveBeenCalledTimes(1);
  runtime.dispose();
});

test('cold results, lifecycle recovery and expired terminal records stay silent', async () => {
  const { runtime, players } = harness();
  runtime.observeMatch({ matchId: 'cold', phase: 'MATCH_RESULT', cue: 'match-win', synced: true });
  expect(runtime.consumeTerminal('cold')).toBeNull();
  runtime.observeMatch({ matchId: 'cold', phase: 'ROUND_RESULT', synced: true });
  runtime.observeMatch({ matchId: 'cold', phase: 'MATCH_RESULT', cue: 'match-win', synced: true });
  expect(runtime.consumeTerminal('cold')).toBeNull();
  runtime.observeMatch({ matchId: 'm1', phase: 'ROUND_RESULT', synced: true });
  runtime.setForeground(false); runtime.setForeground(true);
  runtime.observeMatch({ matchId: 'm1', phase: 'MATCH_RESULT', cue: 'match-win', synced: true });
  expect(runtime.consumeTerminal('m1')).toBeNull();
  runtime.observeMatch({ matchId: 'm2', phase: 'ROUND_RESULT', synced: true });
  runtime.observeMatch({ matchId: 'm2', phase: 'MATCH_RESULT', cue: 'match-win', synced: true });
  jest.advanceTimersByTime(2001);
  expect(runtime.consumeTerminal('m2')).toBeNull();
  await flush(); players.forEach((player) => expect(player.play).not.toHaveBeenCalled());
  runtime.dispose();
});

test('terminal late seek and leaving Result are cancelled; a new match can complete fresh', async () => {
  const { runtime, players } = harness();
  runtime.observeMatch({ matchId: 'm1', phase: 'ROUND_RESULT', synced: true });
  runtime.observeMatch({ matchId: 'm1', phase: 'MATCH_RESULT', cue: 'match-win', synced: true });
  jest.advanceTimersByTime(1900);
  runtime.consumeTerminal('m1');
  let resolve!: () => void;
  players.get('match-win')!.seekTo.mockImplementationOnce(() => new Promise<void>((done) => { resolve = done; }));
  await flush(); jest.advanceTimersByTime(101); resolve(); await flush();
  expect(players.get('match-win')!.play).not.toHaveBeenCalled();
  runtime.observeMatch({ matchId: 'm2', phase: 'ROUND_RESULT', synced: true });
  runtime.observeMatch({ matchId: 'm2', phase: 'MATCH_RESULT', cue: 'match-loss', synced: true });
  runtime.consumeTerminal('m2'); runtime.leaveResult('m2'); await flush();
  expect(players.get('match-loss')!.play).not.toHaveBeenCalled();
  runtime.observeMatch({ matchId: 'm3', phase: 'ROUND_RESULT', synced: true });
  runtime.observeMatch({ matchId: 'm3', phase: 'MATCH_RESULT', cue: 'match-win', synced: true });
  expect(runtime.consumeTerminal('m3')).toBe('match-win'); await flush();
  expect(players.get('match-win')!.play).toHaveBeenCalledTimes(1);
  runtime.dispose();
});

test('mute/background invalidates fresh completion and dispose retires unresolved ad once', () => {
  const { runtime } = harness();
  runtime.observeMatch({ matchId: 'm1', phase: 'ROUND_RESULT', synced: true });
  runtime.observeMatch({ matchId: 'm1', phase: 'MATCH_RESULT', cue: 'match-win', synced: true });
  runtime.settingsSoundChanged(false); runtime.settingsSoundChanged(true);
  expect(runtime.consumeTerminal('m1')).toBeNull();
  runtime.observeMatch({ matchId: 'm2', phase: 'ROUND_RESULT', synced: true });
  runtime.observeMatch({ matchId: 'm2', phase: 'MATCH_RESULT', cue: 'match-win', synced: true });
  runtime.setForeground(false); runtime.setForeground(true);
  expect(runtime.consumeTerminal('m2')).toBeNull();
  const retire = jest.fn(); runtime.beginAd('unclosed', retire);
  runtime.dispose(); runtime.dispose(); expect(retire).toHaveBeenCalledTimes(1);
});

test('ad identity survives preference, foreground and match changes; stale close cannot unsuppress', async () => {
  const { runtime, players } = harness();
  const retire = jest.fn();
  expect(runtime.beginAd('a1', retire)).toBe(true);
  expect(runtime.beginAd('a2', jest.fn())).toBe(false);
  runtime.setMatch('new'); runtime.setForeground(false); runtime.setForeground(true);
  runtime.setPreferences({ hasHydrated: true, soundEnabled: true, vibrationEnabled: false });
  runtime.play('confirm'); await flush(); expect(players.size).toBe(0);
  runtime.settingsSoundChanged(false); runtime.settingsSoundChanged(true); expect(retire).toHaveBeenCalledTimes(1);
  expect(runtime.beginAd('a2', jest.fn())).toBe(true);
  runtime.endAd('a1'); runtime.play('confirm'); await flush(); expect(players.size).toBe(0);
  runtime.endAd('a2'); runtime.play('confirm'); await flush();
  expect(players.get('confirm')!.play).toHaveBeenCalledTimes(1);
  runtime.dispose();
});

test('audio failure is contained and dispose releases finite players/listeners', async () => {
  const { runtime, players } = harness();
  runtime.play('card-flip'); players.get('card-flip')!.seekTo.mockRejectedValue(new Error('native seek'));
  await flush();
  expect(players.get('card-flip')!.play).not.toHaveBeenCalled();
  runtime.play('confirm'); await flush();
  expect(players.get('confirm')!.play).toHaveBeenCalledTimes(1);
  runtime.dispose();
  players.forEach((player) => { expect(player.remove).toHaveBeenCalledTimes(1); expect(player.removed).toHaveBeenCalledTimes(1); });
  runtime.play('confirm'); await flush();
  expect(players.get('confirm')!.play).toHaveBeenCalledTimes(1);
});

test('ten rematches reuse the fixed pool and never revive an old terminal cue', async () => {
  const { runtime, players } = harness();
  await flush();
  const originalPlayers = [...players.values()];
  expect(players.size).toBe(13);
  for (let match = 0; match < 10; match += 1) {
    const id = `match-${match}`;
    runtime.observeMatch({ matchId: id, phase: 'ROUND_RESULT', synced: true });
    runtime.observeMatch({ matchId: id, phase: 'MATCH_RESULT', cue: 'match-win', synced: true });
    expect(runtime.consumeTerminal(id)).toBe('match-win');
    await flush();
    runtime.leaveResult(id); runtime.setMatch(null);
    runtime.play('paper-slide'); await flush();
    expect(runtime.consumeTerminal(id)).toBeNull();
  }
  expect([...players.values()]).toEqual(originalPlayers);
  expect(players.get('match-win')!.play).toHaveBeenCalledTimes(10);
  expect(players.get('paper-slide')!.play).toHaveBeenCalledTimes(10);
  runtime.dispose();
  originalPlayers.forEach((player) => {
    expect(player.remove).toHaveBeenCalledTimes(1);
    expect(player.removed).toHaveBeenCalledTimes(1);
  });
  expect(jest.getTimerCount()).toBe(0);
});

test('welcome requires hydration and runs once per owner; vibration is independent of sound', async () => {
  const { runtime, players, vibrate } = harness();
  runtime.setPreferences({ hasHydrated: false, soundEnabled: true, vibrationEnabled: true });
  runtime.welcome(); await flush(); expect(players.size).toBe(0);
  runtime.setPreferences({ hasHydrated: true, soundEnabled: true, vibrationEnabled: true });
  runtime.welcome(); await flush(); runtime.welcome(); await flush();
  expect(players.get('confirm')!.play).toHaveBeenCalledTimes(1);
  runtime.setPreferences({ hasHydrated: true, soundEnabled: false, vibrationEnabled: true });
  runtime.vibrate(); expect(vibrate).toHaveBeenCalledTimes(1);
  runtime.dispose();
});

test('a completed native player seeks and plays again even when its isLoaded getter reports ENDED', async () => {
  const { runtime, players } = harness();
  runtime.play('ui-tap'); await flush();
  const player = players.get('ui-tap')!;
  player.emit({ isLoaded: true, didJustFinish: true });
  player.isLoaded = false;
  runtime.play('ui-tap'); await flush();
  expect(player.play).toHaveBeenCalledTimes(2);
  runtime.dispose();
});

test('a warmed player that became READY before its listener was attached still plays its first cue', async () => {
  const { runtime, players } = harness(false);
  await flush();
  players.get('confirm')!.isLoaded = true;
  runtime.play('confirm'); await flush();
  expect(players.get('confirm')!.play).toHaveBeenCalledTimes(1);
  runtime.dispose();
});

test('background releases native lifecycle-owned objects before they can auto-resume', async () => {
  const { runtime, players } = harness();
  runtime.play('round-win'); await flush();
  const oldPlayer = players.get('round-win')!;
  runtime.setForeground(false);
  expect(oldPlayer.removed).toHaveBeenCalledTimes(1);
  expect(oldPlayer.remove).toHaveBeenCalledTimes(1);
  runtime.setForeground(true);
  // A fake native foreground hook can only resume an object that was not released.
  if (!oldPlayer.remove.mock.calls.length) oldPlayer.play();
  expect(oldPlayer.play).toHaveBeenCalledTimes(1);
  runtime.play('round-win'); await flush();
  const freshPlayer = players.get('round-win')!;
  expect(freshPlayer).not.toBe(oldPlayer);
  expect(freshPlayer.play).toHaveBeenCalledTimes(1);
  runtime.dispose();
});
