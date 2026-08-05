import { selectedLift } from './motion';

test('reduced motion preserves selection without lift choreography', () => {
  expect(selectedLift(true)).toBe(0);
  expect(selectedLift(false)).toBe(-6);
});
