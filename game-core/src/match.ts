import { GameRuleError } from './errors.js';
import { resolveRound } from './rules.js';
import type {
  CardInstance,
  MatchState,
  PlayerId,
  PlayerState,
  RoundResult,
} from './types.js';
import { RULESET_VERSION } from './types.js';

const PLAYER_A = 'PLAYER_A' as const;
const PLAYER_B = 'PLAYER_B' as const;

function copyPlayer(player: PlayerState, overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    score: overrides.score !== undefined ? overrides.score : player.score,
    cards: overrides.cards !== undefined ? overrides.cards : player.cards.map((card) => ({ ...card })),
    lockedCardId: overrides.lockedCardId !== undefined ? overrides.lockedCardId : player.lockedCardId,
  };
}

function copyPlayers(state: MatchState, playerId: PlayerId, player: PlayerState): MatchState['players'] {
  const players: Record<PlayerId, PlayerState> = {
    [PLAYER_A]: playerId === PLAYER_A ? player : copyPlayer(state.players[PLAYER_A]),
    [PLAYER_B]: playerId === PLAYER_B ? player : copyPlayer(state.players[PLAYER_B]),
  };
  return players;
}

function ensurePlayer(playerId: PlayerId): void {
  if (playerId !== PLAYER_A && playerId !== PLAYER_B) {
    throw new GameRuleError('CARD_NOT_OWNED', `Unknown player: ${playerId}`);
  }
}

export function createMatch(hands: Readonly<Record<PlayerId, readonly CardInstance[]>>): MatchState {
  const allIds = new Set<string>();
  const players = {} as Record<PlayerId, PlayerState>;

  for (const playerId of [PLAYER_A, PLAYER_B] as const) {
    const cards = hands[playerId];
    if (!cards?.length) throw new GameRuleError('EMPTY_HAND', `${playerId} must have at least one card`);
    for (const card of cards) {
      if (allIds.has(card.id)) throw new GameRuleError('DUPLICATE_CARD_ID', `Duplicate card: ${card.id}`);
      if (card.owner !== playerId) {
        throw new GameRuleError('CARD_OWNER_MISMATCH', `${card.id} is not owned by ${playerId}`);
      }
      allIds.add(card.id);
    }
    players[playerId] = { score: 0, cards: cards.map((card) => ({ ...card, used: false })), lockedCardId: null };
  }

  return {
    rulesetVersion: RULESET_VERSION,
    phase: 'ROUND_SELECTION',
    round: 1,
    players,
    discards: [],
    lastRound: null,
    result: null,
  };
}

export function lockCard(state: MatchState, playerId: PlayerId, cardId: string): MatchState {
  ensurePlayer(playerId);
  if (state.phase !== 'ROUND_SELECTION') {
    throw new GameRuleError('INVALID_PHASE', `Cannot lock during ${state.phase}`);
  }

  const player = state.players[playerId];
  const card = player.cards.find((candidate) => candidate.id === cardId);
  if (!card) {
    const belongsToOtherPlayer = Object.values(state.players).some((candidate) =>
      candidate.cards.some((ownedCard) => ownedCard.id === cardId),
    );
    throw new GameRuleError(belongsToOtherPlayer ? 'CARD_NOT_OWNED' : 'CARD_NOT_FOUND', `Cannot lock card ${cardId}`);
  }
  if (card.used) throw new GameRuleError('CARD_ALREADY_USED', `Card ${cardId} was already used`);
  if (player.lockedCardId === cardId) return state;

  const lockedPlayer = copyPlayer(player, { lockedCardId: cardId });
  const players = copyPlayers(state, playerId, lockedPlayer);
  const bothLocked = players[PLAYER_A].lockedCardId !== null && players[PLAYER_B].lockedCardId !== null;
  return { ...state, phase: bothLocked ? 'ROUND_REVEAL' : 'ROUND_SELECTION', players };
}

function updateUsedCard(player: PlayerState, cardId: string): PlayerState {
  return copyPlayer(player, {
    cards: player.cards.map((card) => card.id === cardId ? { ...card, used: true } : { ...card }),
  });
}

export function resolveLockedRound(state: MatchState): MatchState {
  if (state.phase !== 'ROUND_REVEAL') {
    throw new GameRuleError('ROUND_NOT_READY', 'Both players must lock before reveal');
  }

  const playerA = state.players[PLAYER_A];
  const playerB = state.players[PLAYER_B];
  const cardA = playerA.cards.find((card) => card.id === playerA.lockedCardId);
  const cardB = playerB.cards.find((card) => card.id === playerB.lockedCardId);
  if (!cardA || !cardB) throw new GameRuleError('ROUND_NOT_READY', 'Locked cards are missing');

  const outcomeForA = resolveRound(cardA.kind, cardB.kind);
  const scoreDeltaA = outcomeForA === 'WIN' ? 1 : 0;
  const scoreDeltaB = outcomeForA === 'LOSS' ? 1 : 0;
  const nextScoreA = playerA.score + scoreDeltaA;
  const nextScoreB = playerB.score + scoreDeltaB;
  const roundResult: RoundResult = {
    round: state.round,
    playerA: { playerId: PLAYER_A, cardId: cardA.id, kind: cardA.kind },
    playerB: { playerId: PLAYER_B, cardId: cardB.id, kind: cardB.kind },
    outcomeForA,
  };
  const players: Record<PlayerId, PlayerState> = {
    [PLAYER_A]: copyPlayer(updateUsedCard(playerA, cardA.id), { score: nextScoreA, lockedCardId: null }),
    [PLAYER_B]: copyPlayer(updateUsedCard(playerB, cardB.id), { score: nextScoreB, lockedCardId: null }),
  };
  const discards = [...state.discards, roundResult.playerA, roundResult.playerB];

  return { ...state, phase: 'ROUND_RESULT', players, discards, lastRound: roundResult };
}

export function beginNextRound(state: MatchState): MatchState {
  if (state.phase !== 'ROUND_RESULT') {
    throw new GameRuleError('INVALID_PHASE', `Cannot begin next round during ${state.phase}`);
  }
  if (state.round < 4) return { ...state, phase: 'ROUND_SELECTION', round: state.round + 1 };
  const scoreA = state.players.PLAYER_A.score;
  const scoreB = state.players.PLAYER_B.score;
  if (scoreA === scoreB) throw new GameRuleError('FINAL_TIE_IMPOSSIBLE', 'A completed match cannot end in a tie');
  return { ...state, phase: 'MATCH_RESULT', result: {
    winner: scoreA > scoreB ? PLAYER_A : PLAYER_B,
    scores: { PLAYER_A: scoreA, PLAYER_B: scoreB },
  } };
}
