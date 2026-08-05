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
  | 'FINAL_TIE_IMPOSSIBLE';

export class GameRuleError extends Error {
  readonly code: GameErrorCode;

  constructor(code: GameErrorCode, message: string) {
    super(message);
    this.name = 'GameRuleError';
    this.code = code;
  }
}
