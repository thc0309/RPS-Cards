import { GameRuleError } from './errors.js';
import { randomInt, type RandomInt } from './random.js';
import { RULESET_VERSION, type CardInstance, type CardKind, type PlayerId } from './types.js';

const POOL: readonly CardKind[] = ['ROCK', 'PAPER', 'SCISSORS'];

export type DraftPhase = 'DRAFT_PLAYER_A' | 'DRAFT_PLAYER_B' | 'DRAFT_COMPLETE';

export interface DraftPosition {
  readonly position: number;
  readonly card: CardKind;
}

export interface DraftPick {
  readonly position: number;
  readonly card: CardKind;
}

export interface DraftState {
  readonly rulesetVersion: typeof RULESET_VERSION;
  readonly phase: DraftPhase;
  readonly firstDrafter: PlayerId;
  readonly currentPlayerId: PlayerId | null;
  readonly availablePositions: readonly DraftPosition[];
  readonly picks: Readonly<Partial<Record<PlayerId, DraftPick>>>;
  readonly removedCard: CardKind | null;
}

export interface DraftView {
  readonly phase: DraftPhase;
  readonly currentPlayerId: PlayerId | null;
  readonly availablePositions: readonly { readonly position: number; readonly facedown: true }[];
  readonly opponentHasPicked: boolean;
  readonly selectedPosition?: number;
  readonly selectedCard?: CardKind;
}

export interface DraftResult {
  readonly hands: Readonly<Record<PlayerId, readonly CardInstance[]>>;
  readonly extraCards: Readonly<Record<PlayerId, CardKind>>;
  readonly removedCard: CardKind;
}

function otherPlayer(playerId: PlayerId): PlayerId {
  return playerId === 'PLAYER_A' ? 'PLAYER_B' : 'PLAYER_A';
}

function shuffledPool(source: RandomInt): CardKind[] {
  const cards = [...POOL];
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1, source);
    [cards[index], cards[swapIndex]] = [cards[swapIndex]!, cards[index]!];
  }
  return cards;
}

export function createDraft(source: RandomInt): DraftState {
  const firstDrafter = randomInt(2, source) === 0 ? 'PLAYER_A' : 'PLAYER_B';
  const availablePositions = shuffledPool(source).map((card, position) => ({ position, card }));
  return {
    rulesetVersion: RULESET_VERSION,
    phase: firstDrafter === 'PLAYER_A' ? 'DRAFT_PLAYER_A' : 'DRAFT_PLAYER_B',
    firstDrafter,
    currentPlayerId: firstDrafter,
    availablePositions,
    picks: {},
    removedCard: null,
  };
}

function phaseFor(playerId: PlayerId): DraftPhase {
  return playerId === 'PLAYER_A' ? 'DRAFT_PLAYER_A' : 'DRAFT_PLAYER_B';
}

export function pickDraft(state: DraftState, playerId: PlayerId, position: number): DraftState {
  if (state.phase === 'DRAFT_COMPLETE' || state.currentPlayerId !== playerId || state.phase !== phaseFor(playerId)) {
    throw new GameRuleError('INVALID_DRAFT_TURN', `It is not ${playerId}'s draft turn`);
  }
  const selected = state.availablePositions.find((item) => item.position === position);
  if (!selected) throw new GameRuleError('DRAFT_POSITION_UNAVAILABLE', `Draft position ${position} is unavailable`);

  const picks = { ...state.picks, [playerId]: { position, card: selected.card } };
  if (Object.keys(state.picks).length === 1) {
    const removed = state.availablePositions.find((item) => item.position !== position)!;
    return {
      ...state,
      phase: 'DRAFT_COMPLETE',
      currentPlayerId: null,
      availablePositions: [],
      picks,
      removedCard: removed.card,
    };
  }

  const remaining = state.availablePositions
    .filter((item) => item.position !== position)
    .map((item, index) => ({ position: index, card: item.card }));
  const nextPlayer = otherPlayer(playerId);
  return {
    ...state,
    phase: phaseFor(nextPlayer),
    currentPlayerId: nextPlayer,
    availablePositions: remaining,
    picks,
  };
}

export function timeoutPickDraft(state: DraftState, playerId: PlayerId, source: RandomInt): DraftState {
  if (state.currentPlayerId !== playerId || state.availablePositions.length === 0) {
    throw new GameRuleError('INVALID_DRAFT_TURN', `It is not ${playerId}'s draft turn`);
  }
  const selected = state.availablePositions[randomInt(state.availablePositions.length, source)]!;
  return pickDraft(state, playerId, selected.position);
}

export function getDraftView(state: DraftState, viewerId: PlayerId): DraftView {
  const opponent = otherPlayer(viewerId);
  const opponentHasPicked = state.picks[opponent] !== undefined;
  const view: DraftView = {
    phase: state.phase,
    currentPlayerId: state.currentPlayerId,
    availablePositions: state.availablePositions.map(({ position }) => ({ position, facedown: true as const })),
    opponentHasPicked,
  };
  if (state.currentPlayerId === viewerId && state.picks[viewerId]) {
    return { ...view, selectedPosition: state.picks[viewerId]!.position };
  }
  return view;
}

function baseCards(playerId: PlayerId): CardInstance[] {
  return POOL.map((kind) => ({ id: `${playerId.toLowerCase()}-base-${kind.toLowerCase()}`, kind, owner: playerId, used: false }));
}

export function completeDraft(state: DraftState): DraftResult {
  if (state.phase !== 'DRAFT_COMPLETE' || state.removedCard === null) {
    throw new GameRuleError('DRAFT_NOT_COMPLETE', 'Draft is not complete');
  }
  const pickA = state.picks.PLAYER_A;
  const pickB = state.picks.PLAYER_B;
  if (!pickA || !pickB) throw new GameRuleError('DRAFT_NOT_COMPLETE', 'Both players need a draft card');
  const extraCards = { PLAYER_A: pickA.card, PLAYER_B: pickB.card } as const;
  const hands = {
    PLAYER_A: [...baseCards('PLAYER_A'), { id: 'player_a-extra', kind: pickA.card, owner: 'PLAYER_A' as const, used: false }],
    PLAYER_B: [...baseCards('PLAYER_B'), { id: 'player_b-extra', kind: pickB.card, owner: 'PLAYER_B' as const, used: false }],
  } as const;
  return { hands, extraCards, removedCard: state.removedCard };
}
