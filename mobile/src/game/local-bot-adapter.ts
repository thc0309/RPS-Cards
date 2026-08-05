import {
  completeDraft,
  createDraft,
  getDraftView,
  pickDraft,
  timeoutPickDraft,
  type DraftResult,
  type DraftState,
  type RandomInt,
} from '@rps-cards/game-core';
import { createDeadline, type Deadline } from './deadline';

export const DRAFT_TIMEOUT_MS = 5_000;

export interface TimerApi {
  setTimeout: (callback: () => void, delayMs: number) => unknown;
  clearTimeout: (handle: unknown) => void;
}

export interface LocalBotState {
  readonly draft: DraftState;
  readonly view: ReturnType<typeof getDraftView>;
  readonly deadline: Deadline | null;
  readonly selectedPosition: number | null;
  readonly status: 'AVAILABLE' | 'WAITING' | 'COMPLETE';
  readonly result: DraftResult | null;
  readonly acceptedOperations: number;
}

const defaultTimer: TimerApi = {
  setTimeout: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
  clearTimeout: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export class LocalBotDraftAdapter {
  private draft: DraftState;
  private deadline: Deadline | null = null;
  private selectedPosition: number | null = null;
  private result: DraftResult | null = null;
  private timerHandle: unknown = null;
  private operation = 0;
  private listeners = new Set<() => void>();
  private readonly timer: TimerApi;
  private readonly now: () => number;

  constructor(
    private readonly randomInt: RandomInt,
    options: { readonly now?: () => number; readonly timer?: TimerApi } = {},
  ) {
    this.now = options.now ?? (() => Date.now());
    this.timer = options.timer ?? defaultTimer;
    this.draft = createDraft(randomInt);
    this.maybeBotPick();
    this.schedulePlayerDeadline();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): LocalBotState {
    const playerTurn = this.draft.currentPlayerId === 'PLAYER_A';
    return {
      draft: this.draft,
      view: getDraftView(this.draft, 'PLAYER_A'),
      deadline: this.deadline,
      selectedPosition: this.selectedPosition,
      status: this.result ? 'COMPLETE' : playerTurn ? 'AVAILABLE' : 'WAITING',
      result: this.result,
      acceptedOperations: this.operation,
    };
  }

  selectPlayerPosition(position: number): void {
    if (this.result || this.draft.currentPlayerId !== 'PLAYER_A') return;
    this.accept(() => pickDraft(this.draft, 'PLAYER_A', position));
    this.selectedPosition = position;
    this.maybeBotPick();
    this.schedulePlayerDeadline();
  }

  dispose(): void {
    if (this.timerHandle !== null) this.timer.clearTimeout(this.timerHandle);
    this.timerHandle = null;
    this.listeners.clear();
  }

  private accept(action: () => DraftState): void {
    this.draft = action();
    this.operation += 1;
    if (this.draft.phase === 'DRAFT_COMPLETE') this.result = completeDraft(this.draft);
    this.emit();
  }

  private maybeBotPick(): void {
    if (this.result || this.draft.currentPlayerId !== 'PLAYER_B') return;
    this.accept(() => timeoutPickDraft(this.draft, 'PLAYER_B', this.randomInt));
  }

  private schedulePlayerDeadline(): void {
    if (this.result || this.draft.currentPlayerId !== 'PLAYER_A') return;
    if (this.timerHandle !== null) this.timer.clearTimeout(this.timerHandle);
    const operationAtSchedule = this.operation;
    const startedAt = this.now();
    this.deadline = createDeadline(startedAt, DRAFT_TIMEOUT_MS);
    this.timerHandle = this.timer.setTimeout(() => {
      if (this.result || this.operation !== operationAtSchedule || this.draft.currentPlayerId !== 'PLAYER_A') return;
      this.accept(() => timeoutPickDraft(this.draft, 'PLAYER_A', this.randomInt));
      this.maybeBotPick();
      this.schedulePlayerDeadline();
    }, DRAFT_TIMEOUT_MS);
    this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}
