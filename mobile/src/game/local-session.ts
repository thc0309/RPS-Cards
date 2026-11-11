import type { DraftResult } from '@rps-cards/game-core';
import type { LocalMatchAdapter } from './local-match-adapter';

let draftResult: DraftResult | null = null;
let matchAdapter: LocalMatchAdapter | null = null;

export function setLocalDraftResult(result: DraftResult): void { draftResult = result; }
export function getLocalDraftResult(): DraftResult | null { return draftResult; }
export function setLocalMatchAdapter(adapter: LocalMatchAdapter): void {
  // A replaced adapter still owns round timers; stop them before dropping the reference.
  if (matchAdapter && matchAdapter !== adapter) matchAdapter.dispose();
  matchAdapter = adapter;
}
export function getLocalMatchAdapter(): LocalMatchAdapter | null { return matchAdapter; }
export function disposeLocalSession(): void {
  matchAdapter?.dispose();
  matchAdapter = null;
  draftResult = null;
}
