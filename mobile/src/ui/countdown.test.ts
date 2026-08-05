import { remainingSeconds } from './countdown';

test('countdown rounds up and clamps at zero', () => {
  expect(remainingSeconds(6_001, 5_000)).toBe(2);
  expect(remainingSeconds(6_000, 5_000)).toBe(1);
  expect(remainingSeconds(4_999, 5_000)).toBe(0);
  expect(remainingSeconds(undefined, 5_000)).toBe(0);
});
