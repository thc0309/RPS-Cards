import {
  ROUND_PREPARE_MS,
  ROUND_PRESENTATION_MS,
  type RoundTimeline,
  beginNextRound,
  createMatch,
  lockCard,
  resolveLockedRound,
  type CardInstance,
  type MatchState,
  type RandomInt,
} from '@rps-cards/game-core';
import { createDeadline, type Deadline } from './deadline';

export const ROUND_TIMEOUT_MS = 15_000;
export const BOT_THINK_DELAY_MS = 2_000;

export interface LocalMatchState {
  readonly match: MatchState;
  readonly timeline: RoundTimeline | null;
  readonly matchId: string;
  readonly deadline: Deadline | null;
  readonly selectedCardId: string | null;
  readonly acceptedOperations: number;
}

export interface MatchTimerApi {
  setTimeout: (callback: () => void, delayMs: number) => unknown;
  clearTimeout: (handle: unknown) => void;
}

const defaultTimer: MatchTimerApi = {
  setTimeout: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
  clearTimeout: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export class LocalMatchAdapter {
  private match: MatchState;
  private timeline: RoundTimeline | null = null;
  private matchId = 1;
  private presentationTimerHandle: unknown = null;
  private deadline: Deadline | null = null;
  private selectedCardId: string | null = null;
  private deadlineTimerHandle: unknown = null;
  private botTimerHandle: unknown = null;
  private operation = 0;
  private listeners = new Set<() => void>();
  private readonly initialHands: Readonly<Record<'PLAYER_A' | 'PLAYER_B', readonly CardInstance[]>>;
  private readonly timer: MatchTimerApi;
  private readonly now: () => number;

  constructor(
    hands: Readonly<Record<'PLAYER_A' | 'PLAYER_B', readonly CardInstance[]>>,
    private readonly randomInt: RandomInt,
    options: { readonly now?: () => number; readonly timer?: MatchTimerApi } = {},
  ) {
    this.initialHands = hands;
    this.now = options.now ?? (() => Date.now());
    this.timer = options.timer ?? defaultTimer;
    this.match = createMatch(hands);
    this.scheduleDeadline();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  getState(): LocalMatchState {
    return { timeline: this.timeline, matchId: `local-${this.matchId}`, match: this.match, deadline: this.deadline, selectedCardId: this.selectedCardId, acceptedOperations: this.operation };
  }

  lockPlayerCard(cardId: string): void {
    if (this.match.phase !== 'ROUND_SELECTION') return;
    const firstLock = this.match.players.PLAYER_A.lockedCardId === null;
    const nextMatch = lockCard(this.match, 'PLAYER_A', cardId);
    this.selectedCardId = cardId;
    this.accept(() => nextMatch);
    if (firstLock) this.scheduleBotLock();
    this.resolveIfReady();
  }

  rematch(): void {
    this.clearTimers();
    this.match = createMatch(this.initialHands);
    this.timeline = null;
    this.matchId += 1;
    this.selectedCardId = null;
    this.operation = 0;
    this.scheduleDeadline();
    this.emit();
  }

  dispose(): void {
    this.clearTimers();
    this.listeners.clear();
  }

  private lockBotCard(): void {
    if (this.match.phase !== 'ROUND_SELECTION' || this.match.players.PLAYER_B.lockedCardId !== null) return;
    const available = this.match.players.PLAYER_B.cards.filter((card) => !card.used);
    const card = available[this.randomInt(available.length)];
    if (card) this.accept(() => lockCard(this.match, 'PLAYER_B', card.id));
  }

  private scheduleBotLock(): void {
    if (this.botTimerHandle !== null || this.match.phase !== 'ROUND_SELECTION') return;
    this.botTimerHandle = this.timer.setTimeout(() => {
      this.botTimerHandle = null;
      if (this.match.phase !== 'ROUND_SELECTION') return;
      this.lockBotCard();
      this.resolveIfReady();
    }, BOT_THINK_DELAY_MS);
  }

  private resolveIfReady(): void {
    if (this.match.phase !== 'ROUND_REVEAL' || this.presentationTimerHandle !== null) return;
    this.clearTimers();
    const revealAt = this.now() + ROUND_PREPARE_MS;
    this.timeline = { round: this.match.round, revealAt, completeAt: revealAt + ROUND_PRESENTATION_MS };
    this.presentationTimerHandle = this.timer.setTimeout(() => {
      this.presentationTimerHandle = null;
      this.match = resolveLockedRound(this.match);
      this.selectedCardId = null;
      this.presentationTimerHandle = this.timer.setTimeout(() => {
        this.presentationTimerHandle = null;
        this.match = beginNextRound(this.match);
        this.scheduleDeadline();
        this.emit();
      }, Math.max(0, this.timeline!.completeAt - this.now()));
      this.emit();
    }, ROUND_PREPARE_MS);
    this.emit();
  }

  private scheduleDeadline(): void {
    if (this.match.phase !== 'ROUND_SELECTION') return;
    this.clearTimers();
    this.deadline = createDeadline(this.now(), ROUND_TIMEOUT_MS);
    this.deadlineTimerHandle = this.timer.setTimeout(() => {
      this.deadlineTimerHandle = null;
      if (this.match.phase !== 'ROUND_SELECTION') return;
      if (this.match.players.PLAYER_A.lockedCardId === null) {
        const available = this.match.players.PLAYER_A.cards.filter((card) => !card.used);
        const card = available[this.randomInt(available.length)];
        if (card) {
          const nextMatch = lockCard(this.match, 'PLAYER_A', card.id);
          this.selectedCardId = card.id;
          this.accept(() => nextMatch);
        }
      }
      this.lockBotCard();
      this.resolveIfReady();
    }, ROUND_TIMEOUT_MS);
    this.emit();
  }

  private clearTimers(): void {
    if (this.deadlineTimerHandle !== null) this.timer.clearTimeout(this.deadlineTimerHandle);
    if (this.botTimerHandle !== null) this.timer.clearTimeout(this.botTimerHandle);
    if (this.presentationTimerHandle !== null) this.timer.clearTimeout(this.presentationTimerHandle);
    this.presentationTimerHandle = null;
    this.deadlineTimerHandle = null;
    this.botTimerHandle = null;
    this.deadline = null;
  }

  private accept(action: () => MatchState): void {
    this.match = action();
    this.operation += 1;
    this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}
