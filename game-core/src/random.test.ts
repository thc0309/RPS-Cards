import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomInt } from './random.js';

describe('randomInt boundary', () => {
  it('accepts only integers inside the requested range', () => {
    assert.equal(randomInt(3, () => 2), 2);
    assert.throws(() => randomInt(3, () => -1), /RNG_OUT_OF_RANGE/);
    assert.throws(() => randomInt(3, () => 3), /RNG_OUT_OF_RANGE/);
    assert.throws(() => randomInt(3, () => 1.5), /RNG_OUT_OF_RANGE/);
  });
});
