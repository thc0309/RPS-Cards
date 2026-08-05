import {
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

export interface LocalMatchState {
  readonly match: MatchState;
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
  private deadline: Deadline | null = null;
  private selectedCardId: string | null = null;
  private timerHandle: unknown = null;
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
    return { match: this.match, deadline: this.deadline, selectedCardId: this.selectedCardId, acceptedOperations: this.operation };
  }

  lockPlayerCard(cardId: string): void {
    if (this.match.phase !== 'ROUND_SELECTION' || this.selectedCardId !== null) return;
    this.accept(() => lockCard(this.match, 'PLAYER_A', cardId));
    this.selectedCardId = cardId;
    this.lockBotCard();
    this.resolveIfReady();
  }

  rematch(): void {
    this.clearTimer();
    this.match = createMatch(this.initialHands);
    this.selectedCardId = null;
    this.operation = 0;
    this.scheduleDeadline();
    this.emit();
  }

  dispose(): void {
    this.clearTimer();
    this.listeners.clear();
  }

  private lockBotCard(): void {
    if (this.match.phase !== 'ROUND_SELECTION' || this.match.players.PLAYER_B.lockedCardId !== null) return;
    const available = this.match.players.PLAYER_B.cards.filter((card) => !card.used);
    const card = available[this.randomInt(available.length)];
    if (card) this.accept(() => lockCard(this.match, 'PLAYER_B', card.id));
  }

  private resolveIfReady(): void {
    if (this.match.phase !== 'ROUND_REVEAL') return;
    this.match = resolveLockedRound(this.match);
    this.selectedCardId = null;
    this.clearTimer();
    if (this.match.phase === 'ROUND_RESULT') {
      this.match = beginNextRound(this.match);
      this.scheduleDeadline();
    }
    this.emit();
  }

  private scheduleDeadline(): void {
    if (this.match.phase !== 'ROUND_SELECTION') return;
    this.clearTimer();
    const operationAtSchedule = this.operation;
    this.deadline = createDeadline(this.now(), ROUND_TIMEOUT_MS);
    this.timerHandle = this.timer.setTimeout(() => {
      if (this.match.phase !== 'ROUND_SELECTION' || this.selectedCardId !== null || this.operation !== operationAtSchedule) return;
      const available = this.match.players.PLAYER_A.cards.filter((card) => !card.used);
      const card = available[this.randomInt(available.length)];
      if (card) this.lockPlayerCard(card.id);
    }, ROUND_TIMEOUT_MS);
    this.emit();
  }

  private clearTimer(): void {
    if (this.timerHandle !== null) this.timer.clearTimeout(this.timerHandle);
    this.timerHandle = null;
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
