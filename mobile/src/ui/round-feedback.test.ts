import { createRoundFeedbackController, type RoundFeedbackInput } from './round-feedback';

function setup() {
  const feedback = { play: jest.fn(), vibrate: jest.fn(), cancelScope: jest.fn(), observeMatch: jest.fn() };
  const controller = createRoundFeedbackController(feedback, 'board');
  controller.setScreenReaderEnabled(false);
  const input: RoundFeedbackInput = { matchId: 'm1', round: 1, phase: 'ROUND_SELECTION', lockedCardId: null, seat: 'PLAYER_A', synced: true, timeline: null, lastRound: null, deadlineAt: 25000 };
  return { controller, feedback, input };
}
beforeEach(() => { jest.useFakeTimers(); jest.setSystemTime(10000); });
afterEach(() => jest.useRealTimers());

test('accepted lock/replacement speaks once; initial locked/recovery snapshots stay silent', () => {
  const { controller, feedback, input } = setup();
  controller.update(input);
  controller.update({ ...input, lockedCardId: 'a' });
  controller.update({ ...input, lockedCardId: 'a' });
  controller.update({ ...input, lockedCardId: 'b' });
  expect(feedback.play.mock.calls.map(([cue]) => cue)).toEqual(['card-lock', 'card-lock']);
  expect(feedback.vibrate).toHaveBeenCalledTimes(2);
  controller.setForeground(false); controller.setForeground(true);
  controller.update({ ...input, lockedCardId: 'c' });
  expect(feedback.play).toHaveBeenCalledTimes(2);
  controller.dispose();
});

test('same authority timeline emits future prepare/flip/outcome/discard once and inverts seat B', () => {
  const { controller, feedback, input } = setup();
  controller.update(input);
  const timeline = { round: 1, revealAt: 10800, completeAt: 12900 };
  controller.update({ ...input, phase: 'ROUND_REVEAL', timeline });
  jest.advanceTimersByTime(800);
  const lastRound = { round: 1, outcomeForA: 'WIN' as const, playerA: { cardId: 'a', kind: 'ROCK' }, playerB: { cardId: 'b', kind: 'SCISSORS' } };
  const result = { ...input, phase: 'ROUND_RESULT', timeline, lastRound, seat: 'PLAYER_B' as const };
  controller.update(result); controller.update(result);
  jest.advanceTimersByTime(2100);
  expect(feedback.play.mock.calls.map(([cue]) => cue)).toEqual(['tick', 'tick', 'tick', 'card-flip', 'round-loss', 'paper-slide']);
  controller.update(result); jest.advanceTimersByTime(1000);
  expect(feedback.play).toHaveBeenCalledTimes(6);
  controller.dispose();
});

test('late initial outcome never replays earlier cues; obsolete round timers cancel and fresh round works', () => {
  const { controller, feedback, input } = setup();
  const timeline = { round: 1, revealAt: 9000, completeAt: 11100 };
  const lastRound = { round: 1, outcomeForA: 'DRAW' as const, playerA: { cardId: 'a', kind: 'ROCK' }, playerB: { cardId: 'b', kind: 'ROCK' } };
  controller.update({ ...input, phase: 'ROUND_RESULT', timeline, lastRound });
  expect(feedback.play).not.toHaveBeenCalled();
  controller.update({ ...input, round: 2 });
  jest.advanceTimersByTime(1100);
  expect(feedback.play).not.toHaveBeenCalled();
  controller.update({ ...input, round: 1, phase: 'ROUND_RESULT', timeline, lastRound });
  expect(feedback.play).not.toHaveBeenCalled();
  controller.update({ ...input, round: 2, lockedCardId: 'next' });
  expect(feedback.play).toHaveBeenCalledWith('card-lock', expect.objectContaining({ matchId: 'm1' }));
  controller.dispose();
});

test('countdown only fires future3/2/1 while lockable and screen reader off', () => {
  const { controller, feedback, input } = setup();
  controller.update({ ...input, deadlineAt: 15000 });
  jest.advanceTimersByTime(2000);
  expect(feedback.play.mock.calls.map(([cue]) => cue)).toEqual(['tick']);
  controller.setScreenReaderEnabled(true);
  jest.advanceTimersByTime(2000);
  expect(feedback.play).toHaveBeenCalledTimes(1);
  controller.setScreenReaderEnabled(false); jest.advanceTimersByTime(1000);
  expect(feedback.play).toHaveBeenCalledTimes(1);
  controller.dispose();
});

test('forfeit records terminal without inventing flip/outcome; source dispose preserves root record', () => {
  const { controller, feedback, input } = setup();
  controller.update(input);
  controller.update({ ...input, phase: 'MATCH_RESULT', terminalCue: 'connection-lost' });
  expect(feedback.observeMatch).toHaveBeenLastCalledWith(expect.objectContaining({ matchId: 'm1', phase: 'MATCH_RESULT', cue: 'connection-lost', seed: false, synced: true }));
  expect(feedback.play).not.toHaveBeenCalled();
  controller.dispose();
  expect(feedback.cancelScope).toHaveBeenCalledWith('board');
});
