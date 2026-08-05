import test from 'node:test';
import assert from 'node:assert/strict';
import { RULESET_VERSION } from './index.js';

test('exports the immutable MVP ruleset version', () => {
  assert.equal(RULESET_VERSION, 'classic_v1');
});
