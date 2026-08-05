export type CardKind = 'ROCK' | 'PAPER' | 'SCISSORS';
export type RoundOutcome = 'WIN' | 'LOSS' | 'DRAW';
export type PlayerId = 'PLAYER_A' | 'PLAYER_B';
export type MatchPhase = 'ROUND_SELECTION' | 'ROUND_REVEAL' | 'ROUND_RESULT' | 'MATCH_RESULT';

export const RULESET_VERSION = 'classic_v1' as const;
export type RulesetVersion = typeof RULESET_VERSION;

export interface CardInstance {
  readonly id: string;
  readonly kind: CardKind;
  readonly owner: PlayerId;
  readonly used: boolean;
}

export interface PlayerState {
  readonly score: number;
  readonly cards: readonly CardInstance[];
  readonly lockedCardId: string | null;
}

export interface PlayedCard {
  readonly playerId: PlayerId;
  readonly cardId: string;
  readonly kind: CardKind;
}

export interface RoundResult {
  readonly round: number;
  readonly playerA: PlayedCard;
  readonly playerB: PlayedCard;
  readonly outcomeForA: RoundOutcome;
}

export interface MatchResult {
  readonly winner: PlayerId;
  readonly scores: Readonly<Record<PlayerId, number>>;
}

export interface MatchState {
  readonly rulesetVersion: RulesetVersion;
  readonly phase: MatchPhase;
  readonly round: number;
  readonly players: Readonly<Record<PlayerId, PlayerState>>;
  readonly discards: readonly PlayedCard[];
  readonly lastRound: RoundResult | null;
  readonly result: MatchResult | null;
}
