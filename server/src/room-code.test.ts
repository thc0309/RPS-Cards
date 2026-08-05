import test from 'node:test';
import assert from 'node:assert/strict';
import { ROOM_CODE_ALPHABET, allocateRoomCode, isValidRoomCode } from './room-code.js';

test('room codes are five uppercase characters without ambiguous symbols', () => {
  assert.equal(ROOM_CODE_ALPHABET.includes('I'), false);
  assert.equal(ROOM_CODE_ALPHABET.includes('O'), false);
  assert.equal(ROOM_CODE_ALPHABET.includes('0'), false);
  assert.equal(ROOM_CODE_ALPHABET.includes('1'), false);
  assert.equal(isValidRoomCode('ABCD2'), true);
  assert.equal(isValidRoomCode('abcD2'), false);
  assert.equal(isValidRoomCode('ABCD0'), false);
});

test('room code allocation retries bounded collisions', () => {
  const values = ['ABCD2', 'EFGH3'];
  let calls = 0;
  const code = allocateRoomCode(new Set(['ABCD2']), () => values[calls++] ?? 'JKLM4', 3);
  assert.equal(code, 'EFGH3');
  assert.equal(calls, 2);
});
