import { resultOutcome } from './result-outcome';

test('describes win, loss, draw and an early forfeit without inventing rounds', () => {
  expect(resultOutcome(3, 1, true, 4)).toBe('WIN');
  expect(resultOutcome(1, 3, false, 4)).toBe('LOSS');
  expect(resultOutcome(2, 2, false, 4)).toBe('DRAW');
  expect(resultOutcome(1, 0, true, 2)).toBe('FORFEIT_WIN');
});
