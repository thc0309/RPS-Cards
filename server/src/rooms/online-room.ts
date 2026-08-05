import {
  beginNextRound,
  completeDraft,
  createDraft,
  createMatch,
  getDraftView,
  lockCard,
  pickDraft,
  resolveLockedRound,
  timeoutPickDraft,
  validateClientAction,
  type CardInstance,
  type ClientAction,
  type DraftState,
  type MatchState,
  type MatchResult,
  type PlayerId,
  type RoomProjection,
} from '@rps-cards/game-core';
import { ProtocolError } from '@rps-cards/game-core';
import { randomInt as secureRandomInt, randomUUID } from 'node:crypto';
import { MessageRateLimiter } from '../rate-limit.js';

export interface OnlineTimerApi {
  readonly setTimeout: (callback: () => void, delayMs: number) => unknown;
  readonly clearTimeout: (handle: unknown) => void;
}

const defaultTimer: OnlineTimerApi = {
  setTimeout: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
  clearTimeout: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

const cryptoRandomInt = (maxExclusive: number): number => secureRandomInt(maxExclusive);

type OperationResult = { readonly fingerprint: string; readonly result: RoomProjection };
type PlayerRecord = { readonly seat: PlayerId; readonly ready: boolean; readonly connected: boolean; readonly reconnectToken: string; readonly reservationExpired: boolean; readonly lastSeenAt: number };

export class OnlineRoomController {
  readonly roomCode: string;
  get playerCount(): number { return this.players.size; }
  get isClosed(): boolean { return this.closed; }
  get reconnectTimeoutMs(): number { return this.reservationMs; }
  get idempotencySize(): number { return this.operations.size; }
  private readonly players = new Map<string, PlayerRecord>();
  private readonly operations = new Map<string, OperationResult>();
  private readonly randomInt: (maxExclusive: number) => number;
  private readonly timer: OnlineTimerApi;
  private readonly now: () => number;
  private readonly reservationMs: number;
  private readonly draftSelectionTimeoutMs: number;
  private readonly roundSelectionTimeoutMs: number;
  private readonly reservations = new Map<string, unknown>();
  private readonly limiter: MessageRateLimiter;
  private draft: DraftState | null = null;
  private match: MatchState | null = null;
  private forfeitResult: MatchResult | null = null;
  private deadlineAt: number | null = null;
  private timerHandle: unknown = null;
  private closed = false;

  constructor(
    roomCode: string,
    options: { readonly randomInt?: (maxExclusive: number) => number; readonly timer?: OnlineTimerApi; readonly now?: () => number; readonly reconnectTimeoutMs?: number; readonly draftSelectionTimeoutMs?: number; readonly roundSelectionTimeoutMs?: number; readonly maxMessagesPerSecond?: number } = {},
  ) {
    this.roomCode = roomCode;
    this.randomInt = options.randomInt ?? cryptoRandomInt;
    this.timer = options.timer ?? defaultTimer;
    this.now = options.now ?? (() => Date.now());
    this.reservationMs = options.reconnectTimeoutMs ?? 25_000;
    this.draftSelectionTimeoutMs = options.draftSelectionTimeoutMs ?? 5_000;
    this.roundSelectionTimeoutMs = options.roundSelectionTimeoutMs ?? 15_000;
    this.limiter = new MessageRateLimiter(options.maxMessagesPerSecond === undefined ? { now: this.now } : { maxMessagesPerSecond: options.maxMessagesPerSecond, now: this.now });
  }

  join(sessionId: string): PlayerId {
    this.expireInactivePlayers();
    const existing = this.players.get(sessionId);
    if (existing) {
      if (existing.reservationExpired) throw new ProtocolError('ROOM_EXPIRED', 'reconnect reservation expired');
      return existing.seat;
    }
    if (this.closed) throw new ProtocolError('ROOM_EXPIRED', 'room is not available');
    if (this.players.size >= 2) throw new ProtocolError('ROOM_FULL', 'room already has two players');
    const seat: PlayerId = this.players.size === 0 ? 'PLAYER_A' : 'PLAYER_B';
    this.players.set(sessionId, { seat, ready: false, connected: true, reconnectToken: randomUUID(), reservationExpired: false, lastSeenAt: this.now() });
    if (this.players.size === 2 && !this.draft && !this.match) this.startDraft();
    return seat;
  }

  reconnectToken(sessionId: string): string {
    const record = this.players.get(sessionId);
    if (!record || record.reservationExpired) throw new ProtocolError('ROOM_EXPIRED', 'reconnect reservation expired');
    return record.reconnectToken;
  }

  authorize(sessionId: string, reconnectToken: string): void {
    this.expireInactivePlayers();
    const record = this.players.get(sessionId);
    if (!record || record.reservationExpired || record.reconnectToken !== reconnectToken) {
      throw new ProtocolError('ROOM_EXPIRED', 'room is not available');
    }
    this.players.set(sessionId, { ...record, lastSeenAt: this.now() });
  }

  disconnect(sessionId: string): void {
    const record = this.players.get(sessionId);
    if (!record || record.reservationExpired || !record.connected) return;
    this.players.set(sessionId, { ...record, connected: false });
    const handle = this.timer.setTimeout(() => this.expireReservation(sessionId), this.reservationMs);
    this.reservations.set(sessionId, handle);
  }

  reconnect(sessionId: string, token: string): PlayerId {
    this.expireInactivePlayers();
    const record = this.players.get(sessionId);
    if (!record || record.reservationExpired || record.reconnectToken !== token) throw new ProtocolError('ROOM_EXPIRED', 'reconnect reservation expired');
    if (record.connected) return record.seat;
    const reservation = this.reservations.get(sessionId);
    if (reservation !== undefined) this.timer.clearTimeout(reservation);
    this.reservations.delete(sessionId);
    this.players.set(sessionId, { ...record, connected: true, lastSeenAt: this.now() });
    return record.seat;
  }

  leave(sessionId: string): void {
    this.clearReservation(sessionId);
    const record = this.players.get(sessionId);
    if (!record || record.reservationExpired) return;
    this.closed = true;
    this.players.set(sessionId, { ...record, connected: false });
    this.expireReservation(sessionId);
  }

  dispose(): void {
    this.clearDeadline();
    for (const handle of this.reservations.values()) this.timer.clearTimeout(handle);
    this.reservations.clear();
    this.players.clear();
    this.operations.clear();
  }

  projection(sessionId: string): RoomProjection {
    const record = this.players.get(sessionId);
    if (!record) throw new ProtocolError('UNAUTHORIZED_SEAT', 'session is not in room');
    if (record.reservationExpired) throw new ProtocolError('ROOM_EXPIRED', 'reconnect reservation expired');
    return this.buildProjection(record.seat);
  }

  handle(sessionId: string, rawAction: unknown): RoomProjection {
    if (!this.limiter.allow(sessionId)) throw new ProtocolError('RATE_LIMITED', 'message rate exceeded');
    const record = this.players.get(sessionId);
    if (!record) throw new ProtocolError('UNAUTHORIZED_SEAT', 'session is not in room');
    if (!record.connected || record.reservationExpired) throw new ProtocolError('ROOM_EXPIRED', 'reconnect reservation expired');
    const action = validateClientAction(rawAction);
    const fingerprint = JSON.stringify(action);
    const previous = this.operations.get(action.operationId);
    if (previous) {
      if (previous.fingerprint !== fingerprint) throw new ProtocolError('OPERATION_CONFLICT', 'operationId was reused');
      return previous.result;
    }
    this.assertExpected(action);
    if (action.type === 'DRAFT_PICK') this.applyDraftPick(record.seat, action);
    if (action.type === 'LOCK_CARD') this.applyLock(record.seat, action);
    if (action.type === 'REMATCH_READY') this.applyRematch(record.seat, action.payload.ready);
    const result = this.projection(sessionId);
    this.operations.set(action.operationId, { fingerprint, result });
    if (this.operations.size > 256) this.operations.delete(this.operations.keys().next().value!);
    return result;
  }

  private expireReservation(sessionId: string): void {
    this.reservations.delete(sessionId);
    const record = this.players.get(sessionId);
    if (!record || record.connected || record.reservationExpired) return;
    this.players.set(sessionId, { ...record, reservationExpired: true });
    const opponent = [...this.players.values()].find((player) => player.seat !== record.seat && !player.reservationExpired);
    if (!opponent) this.closed = true;
    if (opponent) {
      const scores = this.match?.result?.scores ?? {
        PLAYER_A: this.match?.players.PLAYER_A.score ?? 0,
        PLAYER_B: this.match?.players.PLAYER_B.score ?? 0,
      };
      this.forfeitResult = { winner: opponent.seat, scores };
      this.match = this.match ? { ...this.match, phase: 'MATCH_RESULT', result: this.forfeitResult } : null;
    }
    this.clearDeadline();
  }

  private expireInactivePlayers(): void {
    const now = this.now();
    for (const [sessionId, record] of this.players) {
      if (!record.connected || record.reservationExpired || now - record.lastSeenAt < this.reservationMs) continue;
      this.players.set(sessionId, { ...record, connected: false });
      this.expireReservation(sessionId);
    }
  }

  private clearReservation(sessionId: string): void {
    const handle = this.reservations.get(sessionId);
    if (handle !== undefined) this.timer.clearTimeout(handle);
    this.reservations.delete(sessionId);
  }

  private assertExpected(action: ClientAction): void {
    const phase = this.phase();
    const round = this.match?.round ?? 0;
    if (action.expectedPhase !== phase || action.expectedRound !== round) throw new ProtocolError('STALE_OPERATION', 'phase or round no longer matches');
  }

  private applyDraftPick(seat: PlayerId, action: Extract<ClientAction, { type: 'DRAFT_PICK' }>): void {
    if (!this.draft || this.draft.currentPlayerId !== seat) throw new ProtocolError('UNAUTHORIZED_SEAT', 'seat is not the active drafter');
    this.draft = pickDraft(this.draft, seat, action.payload.position);
    if (this.draft.phase === 'DRAFT_COMPLETE') {
      const result = completeDraft(this.draft);
      this.match = createMatch(result.hands);
      this.draft = null;
      this.scheduleDeadline(this.roundSelectionTimeoutMs);
    } else {
      this.scheduleDeadline(this.draftSelectionTimeoutMs);
    }
  }

  private applyLock(seat: PlayerId, action: Extract<ClientAction, { type: 'LOCK_CARD' }>): void {
    if (!this.match) throw new ProtocolError('STALE_OPERATION', 'match has not started');
    this.match = lockCard(this.match, seat, action.payload.cardId);
    if (this.match.phase === 'ROUND_REVEAL') this.resolveRound();
  }

  private applyRematch(seat: PlayerId, ready: boolean): void {
    if (this.phase() !== 'MATCH_RESULT') throw new ProtocolError('STALE_OPERATION', 'rematch is only available after match result');
    const current = this.players.get(seat === 'PLAYER_A' ? this.sessionFor('PLAYER_A') : this.sessionFor('PLAYER_B'));
    if (!current) throw new ProtocolError('UNAUTHORIZED_SEAT', 'seat is not connected');
    for (const [sessionId, player] of this.players) if (player.seat === seat) this.players.set(sessionId, { ...player, ready });
    if ([...this.players.values()].length === 2 && [...this.players.values()].every((player) => player.ready)) {
      for (const [sessionId, player] of this.players) this.players.set(sessionId, { ...player, ready: false });
      this.startDraft();
    }
  }

  private sessionFor(seat: PlayerId): string {
    const entry = [...this.players.entries()].find(([, player]) => player.seat === seat);
    if (!entry) throw new ProtocolError('UNAUTHORIZED_SEAT', 'seat is not connected');
    return entry[0];
  }

  private startDraft(): void {
    this.match = null;
    this.forfeitResult = null;
    this.draft = createDraft(this.randomInt);
    this.scheduleDeadline(this.draftSelectionTimeoutMs);
  }

  private resolveRound(): void {
    if (!this.match) return;
    this.match = resolveLockedRound(this.match);
    this.clearDeadline();
    if (this.match.phase === 'ROUND_RESULT') {
      this.match = beginNextRound(this.match);
      this.scheduleDeadline(this.roundSelectionTimeoutMs);
    }
  }

  private scheduleDeadline(durationMs: number): void {
    this.clearDeadline();
    this.deadlineAt = this.now() + durationMs;
    this.timerHandle = this.timer.setTimeout(() => this.expire(), durationMs);
  }

  private expire(): void {
    if (this.draft) {
      const player = this.draft.currentPlayerId;
      if (player) {
        this.draft = timeoutPickDraft(this.draft, player, this.randomInt);
        if (this.draft.phase === 'DRAFT_COMPLETE') {
          this.match = createMatch(completeDraft(this.draft).hands);
          this.draft = null;
          this.scheduleDeadline(this.roundSelectionTimeoutMs);
        } else this.scheduleDeadline(this.draftSelectionTimeoutMs);
      }
      return;
    }
    if (!this.match || this.match.phase !== 'ROUND_SELECTION') return;
    for (const seat of ['PLAYER_A', 'PLAYER_B'] as const) {
      if (this.match.players[seat].lockedCardId === null) {
        const available = this.match.players[seat].cards.filter((card) => !card.used);
        const card = available[this.randomInt(available.length)];
        if (card) this.match = lockCard(this.match, seat, card.id);
      }
    }
    if (this.match.phase === 'ROUND_REVEAL') this.resolveRound();
  }

  private clearDeadline(): void {
    if (this.timerHandle !== null) this.timer.clearTimeout(this.timerHandle);
    this.timerHandle = null;
    this.deadlineAt = null;
  }

  private phase(): RoomProjection['phase'] {
    if (this.forfeitResult) return 'MATCH_RESULT';
    if (this.draft) return this.draft.phase === 'DRAFT_COMPLETE' ? 'ROUND_SELECTION' : this.draft.phase;
    if (this.match) return this.match.phase;
    return this.players.size < 2 ? 'WAITING' : 'ROUND_SELECTION';
  }

  private buildProjection(ownSeat: PlayerId): RoomProjection {
    const matchPlayers = this.match?.players;
    const players = [...this.players.values()].map(({ seat }) => ({
      seat,
      cardCount: matchPlayers ? matchPlayers[seat].cards.filter((card) => !card.used).length : 0,
      locked: matchPlayers?.[seat].lockedCardId !== null && matchPlayers?.[seat].lockedCardId !== undefined,
      score: matchPlayers?.[seat].score ?? 0,
      discards: this.match?.discards.filter((card) => card.playerId === seat).map(({ cardId, kind }) => ({ cardId, kind })) ?? [],
      cardSkinId: 'folk_default' as const,
      boardThemeId: 'folk_default' as const,
    }));
    const ownCards: readonly CardInstance[] = matchPlayers?.[ownSeat].cards ?? [];
    const draftView = this.draft ? {
      activeSeat: this.draft.currentPlayerId,
      ...getDraftView(this.draft, ownSeat),
      ...(this.draft.picks[ownSeat] ? { selectedPosition: this.draft.picks[ownSeat]!.position } : {}),
    } : null;
    const projection: RoomProjection = {
      rulesetVersion: 'classic_v1',
      roomCode: this.roomCode,
      phase: this.phase(),
      round: this.match?.round ?? 0,
      players,
      own: {
        ...players.find((player) => player.seat === ownSeat)!,
        hand: ownCards.map(({ id, kind, used }) => ({ id, kind, used })),
        draft: draftView,
      },
      lastRound: this.match?.lastRound ? { round: this.match.lastRound.round, playerA: this.match.lastRound.playerA, playerB: this.match.lastRound.playerB } : null,
      result: this.forfeitResult ?? this.match?.result ?? null,
      rematchReady: [...this.players.values()].filter((player) => player.ready).map((player) => player.seat),
    };
    return this.deadlineAt === null ? projection : { ...projection, deadlineAt: this.deadlineAt };
  }
}
