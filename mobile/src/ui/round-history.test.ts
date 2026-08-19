import { pairRoundHistory } from './round-history';

test('pairs only real completed rounds in play order', () => {
  expect(pairRoundHistory(['ROCK', 'PAPER', 'SCISSORS'], ['PAPER', 'ROCK'])).toEqual([
    { round: 1, local: 'ROCK', opponent: 'PAPER' },
    { round: 2, local: 'PAPER', opponent: 'ROCK' },
  ]);
});
