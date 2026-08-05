import { randomInt as cryptoRandomInt } from 'node:crypto';

export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_LENGTH = 5;
export const ROOM_CODE_MAX_ATTEMPTS = 8;

export function isValidRoomCode(value: string): boolean {
  return value.length === ROOM_CODE_LENGTH && [...value].every((character) => ROOM_CODE_ALPHABET.includes(character));
}

export function createRoomCode(randomInt: (maxExclusive: number) => number = cryptoRandomInt): string {
  return Array.from({ length: ROOM_CODE_LENGTH }, () => ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)]).join('');
}

export function allocateRoomCode(
  existing: ReadonlySet<string>,
  nextCode: () => string = () => createRoomCode(),
  maxAttempts = ROOM_CODE_MAX_ATTEMPTS,
): string {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = nextCode();
    if (isValidRoomCode(candidate) && !existing.has(candidate)) return candidate;
  }
  throw new Error('ROOM_CODE_ALLOCATION_EXHAUSTED');
}
