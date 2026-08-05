export { RULESET_VERSION } from './types.js';

export type { RulesetVersion } from './types.js';
export type {
  CardInstance,
  CardKind,
  MatchPhase,
  MatchResult,
  MatchState,
  PlayerId,
  PlayerState,
  PlayedCard,
  RoundOutcome,
  RoundResult,
} from './types.js';
export { GameRuleError } from './errors.js';
export type { GameErrorCode } from './errors.js';
export { resolveRound } from './rules.js';
export { beginNextRound, createMatch, lockCard, resolveLockedRound } from './match.js';
