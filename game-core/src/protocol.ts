import { ProtocolError } from './errors.js';
import { RULESET_VERSION, type RulesetVersion } from './types.js';

export type ClientAction =
  | { readonly type: 'DRAFT_PICK'; readonly operationId: string; readonly expectedPhase: 'DRAFT_PLAYER_A' | 'DRAFT_PLAYER_B'; readonly expectedRound: 0; readonly payload: { readonly position: number } }
  | { readonly type: 'LOCK_CARD'; readonly operationId: string; readonly expectedPhase: 'ROUND_SELECTION'; readonly expectedRound: number; readonly payload: { readonly cardId: string } }
  | { readonly type: 'REMATCH_READY'; readonly operationId: string; readonly expectedPhase: 'MATCH_RESULT'; readonly expectedRound: number; readonly payload: { readonly ready: boolean } };

export type ClientActionPhase = 'DRAFT_PLAYER_A' | 'DRAFT_PLAYER_B' | 'ROUND_SELECTION' | 'MATCH_RESULT';
export type RoomPhase = ClientActionPhase | 'WAITING' | 'ROUND_REVEAL' | 'ROUND_RESULT';

export interface DraftProjection {
  readonly activeSeat: 'PLAYER_A' | 'PLAYER_B' | null;
  readonly availablePositions: readonly { readonly position: number; readonly facedown: true }[];
  readonly opponentHasPicked: boolean;
  readonly selectedPosition?: number;
}

export interface PublicPlayerProjection {
  readonly seat: 'PLAYER_A' | 'PLAYER_B';
  readonly cardCount: number;
  readonly locked: boolean;
  readonly score: number;
  readonly discards: readonly { readonly cardId: string; readonly kind: string }[];
  readonly cardSkinId: 'folk_default';
  readonly boardThemeId: 'folk_default';
}

export interface PrivatePlayerProjection extends PublicPlayerProjection {
  readonly hand: readonly { readonly id: string; readonly kind: string; readonly used: boolean }[];
  readonly draft: DraftProjection | { readonly kind: string } | null;
  readonly lockedCardId: string | null;
}

export interface RoomProjection {
  readonly rulesetVersion: RulesetVersion;
  readonly roomCode: string;
  readonly phase: RoomPhase;
  readonly round: number;
  readonly players: readonly PublicPlayerProjection[];
  readonly own: PrivatePlayerProjection;
  readonly deadlineAt?: number;
  readonly lastRound?: { readonly round: number; readonly playerA: { readonly cardId: string; readonly kind: string }; readonly playerB: { readonly cardId: string; readonly kind: string } } | null;
  readonly result?: { readonly winner: 'PLAYER_A' | 'PLAYER_B'; readonly scores: Readonly<Record<'PLAYER_A' | 'PLAYER_B', number>> } | null;
  readonly rematchReady?: readonly ('PLAYER_A' | 'PLAYER_B')[];
}

export function validateClientAction(value: unknown): ClientAction {
  if (!value || typeof value !== 'object') throw new ProtocolError('INVALID_MESSAGE', 'action must be an object');
  const input = value as Record<string, unknown>;
  const type = input.type;
  const operationId = input.operationId;
  const expectedPhase = input.expectedPhase as ClientActionPhase;
  const expectedRound = input.expectedRound;
  const payload = input.payload;
  const keys = Object.keys(input);
  if (keys.some((key) => !['type', 'operationId', 'expectedPhase', 'expectedRound', 'payload'].includes(key))) throw new ProtocolError('INVALID_MESSAGE', 'action envelope has unknown fields');
  const round = typeof expectedRound === 'number' ? expectedRound : NaN;
  if ((type !== 'DRAFT_PICK' && type !== 'LOCK_CARD' && type !== 'REMATCH_READY') || typeof operationId !== 'string' || operationId.length < 1 || operationId.length > 80 || !Number.isInteger(round) || round < 0 || !payload || typeof payload !== 'object') {
    throw new ProtocolError('INVALID_MESSAGE', 'action envelope is invalid');
  }
  const body = payload as Record<string, unknown>;
  if (type === 'DRAFT_PICK' && (expectedPhase === 'DRAFT_PLAYER_A' || expectedPhase === 'DRAFT_PLAYER_B') && round === 0 && Number.isInteger(body.position) && (body.position as number) >= 0 && (body.position as number) <= 3 && Object.keys(body).every((key) => key === 'position')) return { type, operationId, expectedPhase, expectedRound: 0, payload: { position: body.position as number } };
  if (type === 'LOCK_CARD' && expectedPhase === 'ROUND_SELECTION' && round >= 1 && typeof body.cardId === 'string' && body.cardId.length > 0 && body.cardId.length <= 80 && Object.keys(body).every((key) => key === 'cardId')) return { type, operationId, expectedPhase, expectedRound: round, payload: { cardId: body.cardId } };
  if (type === 'REMATCH_READY' && expectedPhase === 'MATCH_RESULT' && round <= 4 && typeof body.ready === 'boolean' && Object.keys(body).every((key) => key === 'ready')) return { type, operationId, expectedPhase, expectedRound: round, payload: { ready: body.ready } };
  throw new ProtocolError('INVALID_MESSAGE', 'action payload is invalid');
}

export function normalizeCatalogId(value: unknown): 'folk_default' {
  return value === 'folk_default' ? 'folk_default' : 'folk_default';
}

export const MVP_RULESET: RulesetVersion = RULESET_VERSION;
