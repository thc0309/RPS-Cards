import { getRoundPresentation, acceptBoardSnapshot } from './board-round-presentation';
import type { RoomProjection } from '@rps-cards/game-core';

const round = { round: 1, outcomeForA: 'WIN' as const, playerA: { cardId: 'a', kind: 'ROCK' }, playerB: { cardId: 'b', kind: 'SCISSORS' } };
const timeline = { round: 1, revealAt: 1000, completeAt: 3100 };
test('timeline keeps faces/score private, reveals both, then publishes result and discards', () => {
  expect(getRoundPresentation('ROUND_REVEAL', 1, timeline, null, 900, 'PLAYER_A').stage).toBe('prepare');
  expect(getRoundPresentation('ROUND_RESULT', 1, timeline, round, 1200, 'PLAYER_A')).toMatchObject({ stage: 'flip', facesVisible: false, scoreVisible: false, discardsVisible: false });
  expect(getRoundPresentation('ROUND_RESULT', 1, timeline, round, 1400, 'PLAYER_A').facesVisible).toBe(true);
  expect(getRoundPresentation('ROUND_RESULT', 1, timeline, round, 1600, 'PLAYER_B')).toMatchObject({ stage: 'outcome', outcome: 'LOSS', scoreVisible: true });
  expect(getRoundPresentation('ROUND_RESULT', 1, timeline, round, 2900, 'PLAYER_A').stage).toBe('discard');
  expect(getRoundPresentation('ROUND_SELECTION', 2, timeline, round, 3200, 'PLAYER_A')).toMatchObject({ stage: 'selection', facesVisible: false, outcome: 'WIN' });
  expect(getRoundPresentation('ROUND_REVEAL', 2, { ...timeline, round: 2 }, round, 1500, 'PLAYER_A').outcome).toBe(null);
  expect(getRoundPresentation('ROUND_RESULT', 1, timeline, null, 1700, 'PLAYER_A').facesVisible).toBe(false);
  expect(getRoundPresentation('ROUND_RESULT', 1, timeline, round, 3200, 'PLAYER_A')).toMatchObject({ stage: 'complete', cards: null, discardsVisible: true, scoreVisible: true });
  expect(getRoundPresentation('MATCH_RESULT', 1, null, round, 3200, 'PLAYER_A')).toMatchObject({ stage: 'complete', cards: null, outcome: null });
});
test('all ingress rejects reordered revisions across rematch and accepts current duplicate without replay', () => {
  const current = { revision: 10, matchId: 'old', serverNow: 5000 } as RoomProjection;
  expect(acceptBoardSnapshot(current, { ...current, revision: 9 })).toBe(false);
  expect(acceptBoardSnapshot(current, { ...current, revision: 11, matchId: 'new' })).toBe(true);
  expect(acceptBoardSnapshot(current, { ...current, serverNow: 4900 })).toBe(false);
  expect(acceptBoardSnapshot(current, { ...current, serverNow: 5100 })).toBe(true);
});
