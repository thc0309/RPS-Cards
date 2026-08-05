export type GameErrorCode =
  | 'INVALID_PHASE'
  | 'CARD_NOT_FOUND'
  | 'CARD_NOT_OWNED'
  | 'CARD_ALREADY_USED'
  | 'PLAYER_ALREADY_LOCKED'
  | 'ROUND_NOT_READY'
  | 'EMPTY_HAND'
  | 'DUPLICATE_CARD_ID'
  | 'CARD_OWNER_MISMATCH'
  | 'FINAL_TIE_IMPOSSIBLE'
  | 'INVALID_DRAFT_TURN'
  | 'DRAFT_POSITION_UNAVAILABLE'
  | 'DRAFT_NOT_COMPLETE';

export type ProtocolErrorCode =
  | 'INVALID_MESSAGE'
  | 'STALE_OPERATION'
  | 'OPERATION_CONFLICT'
  | 'UNAUTHORIZED_SEAT'
  | 'RATE_LIMITED'
  | 'ROOM_FULL'
  | 'ROOM_NOT_FOUND'
  | 'ROOM_EXPIRED'
  | 'RULESET_UNSUPPORTED';

export class GameRuleError extends Error {
  readonly code: GameErrorCode;

  constructor(code: GameErrorCode, message: string) {
    super(`${code}: ${message}`);
    this.name = 'GameRuleError';
    this.code = code;
  }
}

export class ProtocolError extends Error {
  readonly code: ProtocolErrorCode;

  constructor(code: ProtocolErrorCode, message: string) {
    super(`${code}: ${message}`);
    this.name = 'ProtocolError';
    this.code = code;
  }
}
