export type RandomInt = (maxExclusive: number) => number;

export function randomInt(maxExclusive: number, source: RandomInt): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError('RNG_MAX_INVALID');
  }
  const value = source(maxExclusive);
  if (!Number.isInteger(value) || value < 0 || value >= maxExclusive) {
    throw new RangeError('RNG_OUT_OF_RANGE');
  }
  return value;
}
