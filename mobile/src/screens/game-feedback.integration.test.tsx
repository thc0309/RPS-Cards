import React from 'react';
import { act, create } from 'react-test-renderer';
import { AppState, View, type AppStateStatus } from 'react-native';
import { ROUND_PREPARE_MS, ROUND_PRESENTATION_MS, type RoomProjection } from '@rps-cards/game-core';
import { FeedbackProvider } from '../ui/feedback';
import { FolkBoardView, FolkResultView } from '../components/FolkGameViews';
import { LocalBotDraftAdapter } from '../game/local-bot-adapter';
import { BOT_THINK_DELAY_MS, LocalMatchAdapter } from '../game/local-match-adapter';
import { disposeLocalSession, setLocalMatchAdapter } from '../game/local-session';
import { BoardScreen } from './BoardScreen';
import { ResultScreen } from './ResultScreen';
import { OnlineBoardScreen } from './OnlineBoardScreen';
import { OnlineResultScreen } from './OnlineResultScreen';

const mockRouter = { replace: jest.fn() };
const mockClient = { snapshot: jest.fn(), action: jest.fn(), leave: jest.fn() };
const mockPlayers: { play: jest.Mock; pause: jest.Mock; remove: jest.Mock }[] = [];
const mockStore = Object.assign((select: (state: { locale: string; setActiveRoom: () => void }) => unknown) => select({ locale: 'en', setActiveRoom: jest.fn() }), {
  getState: () => ({ hasHydrated: true, soundEnabled: true, vibrationEnabled: false }), subscribe: () => () => {},
});
jest.mock('../store/app-store', () => ({ useAppStore: Object.assign((select: Parameters<typeof mockStore>[0]) => mockStore(select), { getState: () => mockStore.getState(), subscribe: () => mockStore.subscribe() }) }));
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => ({ roomCode: 'ABCDE', sessionId: 'a' }) }));
jest.mock('../game/colyseus-client', () => ({ createOnlineRoomClient: () => mockClient }));
jest.mock('../security/reconnect-credential', () => ({ deleteReconnectCredential: jest.fn() }));
jest.mock('../components/FolkGameViews', () => ({ FolkBoardView: () => null, FolkResultView: () => null, FolkResultLoadingView: () => null }));
jest.mock('expo-audio', () => ({ setAudioModeAsync: jest.fn().mockResolvedValue(undefined), createAudioPlayer: () => {
  const player = { isLoaded: true, play: jest.fn(), pause: jest.fn(), remove: jest.fn(), seekTo: jest.fn().mockResolvedValue(undefined), addListener: () => ({ remove: jest.fn() }) };
  mockPlayers.push(player); return player;
} }));

const lifecycle = new Set<(state: AppStateStatus) => void>();
const totalPlays = () => mockPlayers.reduce((total, player) => total + player.play.mock.calls.length, 0);
function emitAppState(state: AppStateStatus) { Object.defineProperty(AppState, 'currentState', { value: state, configurable: true }); lifecycle.forEach((callback) => callback(state)); }
beforeEach(() => {
  jest.useFakeTimers(); jest.setSystemTime(10000); lifecycle.clear(); mockPlayers.length = 0;
  mockRouter.replace.mockReset(); mockClient.snapshot.mockReset(); mockClient.action.mockReset();
  Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, callback) => { lifecycle.add(callback); return { remove: () => lifecycle.delete(callback) }; });
});
afterEach(() => { disposeLocalSession(); jest.restoreAllMocks(); jest.useRealTimers(); });

function createBotMatch() {
  const draft = new LocalBotDraftAdapter(() => 0); draft.selectPlayerPosition(0);
  const hands = draft.getState().result!.hands; draft.dispose();
  const adapter = new LocalMatchAdapter(hands, () => 0); setLocalMatchAdapter(adapter);
  return { adapter, hands };
}

test('real BOT Board records before navigation; source unmount then Result consumes one fanfare across remount', async () => {
  const { adapter, hands } = createBotMatch();
  let tree!: ReturnType<typeof create>;
  await act(async () => { tree = create(<FeedbackProvider><BoardScreen /></FeedbackProvider>); });
  for (const card of hands.PLAYER_A) {
    await act(async () => {
      tree.root.findByType(FolkBoardView).props.onLock(card.id);
      jest.advanceTimersByTime(BOT_THINK_DELAY_MS + ROUND_PREPARE_MS + ROUND_PRESENTATION_MS);
    });
  }
  expect(adapter.getState().match.phase).toBe('MATCH_RESULT');
  expect(mockRouter.replace).toHaveBeenCalledWith('/result');
  const before = totalPlays();
  await act(async () => { tree.update(<FeedbackProvider><ResultScreen /></FeedbackProvider>); });
  expect(totalPlays() - before).toBe(1);
  expect(tree.root.findByType(FolkResultView).props.celebrateWin).toBe(adapter.getState().match.result!.winner === 'PLAYER_A');
  await act(async () => { tree.update(<FeedbackProvider><ResultScreen /></FeedbackProvider>); });
  await act(async () => { tree.update(<FeedbackProvider><View /></FeedbackProvider>); });
  await act(async () => { tree.update(<FeedbackProvider><ResultScreen /></FeedbackProvider>); });
  expect(totalPlays() - before).toBe(1);
  expect(tree.root.findByType(FolkResultView).props.celebrateWin).toBe(false);
  await act(async () => { tree.root.findByType(FolkResultView).props.onPrimary(); });
  expect(mockRouter.replace).toHaveBeenLastCalledWith('/draft');
  expect(totalPlays() - before).toBe(2);
  act(() => tree.unmount());
});

function onlineSnapshot(phase: RoomProjection['phase'], revision: number): RoomProjection {
  const player = { seat: 'PLAYER_A' as const, locked: false, cardCount: 4, score: 0, discards: [], cardSkinId: 'folk_default' as const, boardThemeId: 'folk_default' as const };
  const opponent = { ...player, seat: 'PLAYER_B' as const };
  return { rulesetVersion: 'classic_v1', roomCode: 'ABCDE', phase, revision, round: 1, matchId: 'online-match', serverNow: Date.now(), players: [player, opponent], own: { ...player, hand: [{ id: 'a', kind: 'ROCK', used: false }], draft: null, lockedCardId: null }, result: phase === 'MATCH_RESULT' ? { winner: 'PLAYER_A', scores: { PLAYER_A: 0, PLAYER_B: 0 } } : null };
}

test('online accepted forfeit survives separate Result fetch; duplicates and cold result remain silent', async () => {
  mockClient.snapshot.mockResolvedValue(onlineSnapshot('ROUND_SELECTION', 1));
  let tree!: ReturnType<typeof create>;
  await act(async () => { tree = create(<FeedbackProvider><OnlineBoardScreen /></FeedbackProvider>); });
  mockClient.snapshot.mockResolvedValue(onlineSnapshot('MATCH_RESULT', 2));
  await act(async () => { jest.advanceTimersByTime(500); });
  expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/result', params: { roomCode: 'ABCDE', sessionId: 'a' } });
  const before = totalPlays();
  await act(async () => { tree.update(<FeedbackProvider><OnlineResultScreen /></FeedbackProvider>); });
  expect(tree.root.findByType(FolkResultView).props.outcome).toBe('You win · Opponent left the room');
  expect(tree.root.findByType(FolkResultView).props.history).toEqual([]);
  expect(tree.root.findByType(FolkResultView).props.celebrateWin).toBe(false);
  expect(totalPlays() - before).toBe(1);
  await act(async () => { jest.advanceTimersByTime(1400); });
  expect(totalPlays() - before).toBe(1);
  act(() => tree.unmount());
  mockPlayers.length = 0;
  await act(async () => { tree = create(<FeedbackProvider><OnlineResultScreen /></FeedbackProvider>); });
  expect(totalPlays()).toBe(0);
  act(() => tree.unmount());
});

test('background between trusted completion and Result invalidates the pending fanfare', async () => {
  mockClient.snapshot.mockResolvedValue(onlineSnapshot('ROUND_SELECTION', 1));
  let tree!: ReturnType<typeof create>;
  await act(async () => { tree = create(<FeedbackProvider><OnlineBoardScreen /></FeedbackProvider>); });
  mockClient.snapshot.mockResolvedValue(onlineSnapshot('MATCH_RESULT', 2));
  await act(async () => { jest.advanceTimersByTime(500); });
  act(() => emitAppState('background'));
  act(() => emitAppState('active'));
  const before = totalPlays();
  await act(async () => { tree.update(<FeedbackProvider><OnlineResultScreen /></FeedbackProvider>); });
  expect(totalPlays()).toBe(before);
  act(() => tree.unmount());
});

test('slow separate Result fetch past two seconds cannot resurrect the terminal record', async () => {
  mockClient.snapshot.mockResolvedValue(onlineSnapshot('ROUND_SELECTION', 1));
  let tree!: ReturnType<typeof create>;
  await act(async () => { tree = create(<FeedbackProvider><OnlineBoardScreen /></FeedbackProvider>); });
  const result = onlineSnapshot('MATCH_RESULT', 2);
  mockClient.snapshot.mockResolvedValue(result);
  await act(async () => { jest.advanceTimersByTime(500); });
  let resolve!: (value: RoomProjection) => void;
  mockClient.snapshot.mockReturnValue(new Promise<RoomProjection>((done) => { resolve = done; }));
  const before = totalPlays();
  await act(async () => { tree.update(<FeedbackProvider><OnlineResultScreen /></FeedbackProvider>); });
  await act(async () => { jest.advanceTimersByTime(2001); resolve(result); });
  expect(totalPlays()).toBe(before);
  act(() => tree.unmount());
});
