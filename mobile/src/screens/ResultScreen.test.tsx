import React from 'react';
import { act, create } from 'react-test-renderer';
import { ROUND_PREPARE_MS, ROUND_PRESENTATION_MS } from '@rps-cards/game-core';
import { FolkResultView } from '../components/FolkGameViews';
import { LocalBotDraftAdapter } from '../game/local-bot-adapter';
import { BOT_THINK_DELAY_MS, LocalMatchAdapter } from '../game/local-match-adapter';
import { disposeLocalSession, getLocalDraftResult, getLocalMatchAdapter, setLocalDraftResult, setLocalMatchAdapter } from '../game/local-session';
import { ResultScreen } from './ResultScreen';

const mockRouter = { replace: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
jest.mock('../store/app-store', () => ({ useAppStore: (select: (state: { locale: string }) => unknown) => select({ locale: 'vi' }) }));
jest.mock('../components/FolkGameViews', () => ({ FolkResultView: () => null, FolkResultLoadingView: () => null }));

afterEach(() => { disposeLocalSession(); jest.useRealTimers(); mockRouter.replace.mockReset(); });

test('Đấu lại clears the finished BOT session and returns to a fresh draft', () => {
  jest.useFakeTimers();
  const draft = new LocalBotDraftAdapter(() => 0);
  draft.selectPlayerPosition(0);
  const result = draft.getState().result!;
  setLocalDraftResult(result);
  draft.dispose();
  const adapter = new LocalMatchAdapter(result.hands, () => 0);
  setLocalMatchAdapter(adapter);
  for (const card of result.hands.PLAYER_A) {
    adapter.lockPlayerCard(card.id);
    jest.advanceTimersByTime(BOT_THINK_DELAY_MS + ROUND_PREPARE_MS + ROUND_PRESENTATION_MS);
  }
  expect(adapter.getState().match.phase).toBe('MATCH_RESULT');
  const dispose = jest.spyOn(adapter, 'dispose');
  let tree!: ReturnType<typeof create>;
  act(() => { tree = create(<ResultScreen />); });
  expect(tree.root.findByType(FolkResultView).props.primaryLabel).toBe('Đấu lại');
  act(() => tree.root.findByType(FolkResultView).props.onPrimary());
  expect(mockRouter.replace).toHaveBeenCalledWith('/draft');
  expect(dispose).toHaveBeenCalledTimes(1);
  expect(getLocalMatchAdapter()).toBeNull();
  expect(getLocalDraftResult()).toBeNull();
  expect(adapter.getState().match.phase).toBe('MATCH_RESULT');
  act(() => tree.unmount());
  expect(jest.getTimerCount()).toBe(0);
});
