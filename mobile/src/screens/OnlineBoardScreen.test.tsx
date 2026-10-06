import React from 'react';
import { act, create } from 'react-test-renderer';
import { AppState, type AppStateStatus } from 'react-native';
import type { RoomProjection } from '@rps-cards/game-core';
import { OnlineBoardScreen } from './OnlineBoardScreen';
import { FolkBoardView } from '../components/FolkGameViews';

const mockRouter = { replace: jest.fn() };
const mockClient = { snapshot: jest.fn(), action: jest.fn() };
let mockAppStateChange: (state: AppStateStatus) => void;
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => ({ roomCode: 'ABCDE', sessionId: 'a' }) }));
jest.mock('../game/colyseus-client', () => ({ createOnlineRoomClient: () => mockClient }));
jest.mock('../store/app-store', () => ({ useAppStore: (select: (state: { locale: string }) => unknown) => select({ locale: 'en' }) }));
jest.mock('../ui/motion', () => ({ useReducedMotion: () => false, selectedLift: () => 0 }));
jest.mock('../components/FolkGameViews', () => ({ FolkBoardView: () => null }));
function snapshot(revision = 1, phase: RoomProjection['phase'] = 'ROUND_SELECTION'): RoomProjection {
  const player = { seat: 'PLAYER_A' as const, locked: false, cardCount: 4, score: 0, discards: [], cardSkinId: 'folk_default' as const, boardThemeId: 'folk_default' as const };
  return { rulesetVersion: 'classic_v1', roomCode: 'ABCDE', phase, round: 1, revision, matchId: 'match', serverNow: Date.now(), players: [player], own: { ...player, hand: [{ id: 'a', kind: 'ROCK', used: false }], draft: null, lockedCardId: null } };
}
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>((done) => { resolve = done; }); return { promise, resolve }; }
beforeEach(() => {
  jest.useFakeTimers();
  mockClient.snapshot.mockReset(); mockClient.action.mockReset(); mockRouter.replace.mockReset();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, callback) => { mockAppStateChange = callback; return { remove: jest.fn() }; });
  Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });
});
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });
test('bounds polls and rejects an in-flight pre-background response until a fresh resume snapshot', async () => {
  const old = deferred<RoomProjection>(); const fresh = deferred<RoomProjection>();
  mockClient.snapshot.mockReturnValueOnce(old.promise).mockReturnValueOnce(fresh.promise);
  let tree!: ReturnType<typeof create>;
  await act(async () => { tree = create(<OnlineBoardScreen />); });
  act(() => jest.advanceTimersByTime(2000));
  expect(mockClient.snapshot).toHaveBeenCalledTimes(1);
  act(() => mockAppStateChange('background'));
  act(() => mockAppStateChange('active'));
  expect(mockClient.snapshot).toHaveBeenCalledTimes(2);
  await act(async () => old.resolve(snapshot(10)));
  expect(tree.root.findAllByType(FolkBoardView)).toHaveLength(0);
  await act(async () => fresh.resolve(snapshot(11)));
  expect(tree.root.findByType(FolkBoardView).props.canLock).toBe(true);
  act(() => tree.unmount());
});
test('stale action response cannot regress a newer poll and does not navigate after unmount', async () => {
  const action = deferred<RoomProjection>();
  mockClient.snapshot.mockResolvedValueOnce(snapshot(1)).mockResolvedValue(snapshot(3, 'ROUND_REVEAL'));
  mockClient.action.mockReturnValue(action.promise);
  let tree!: ReturnType<typeof create>;
  await act(async () => { tree = create(<OnlineBoardScreen />); });
  act(() => { void tree.root.findByType(FolkBoardView).props.onLock('a'); });
  await act(async () => { jest.advanceTimersByTime(500); });
  expect(tree.root.findByType(FolkBoardView).props.canLock).toBe(false);
  await act(async () => action.resolve(snapshot(2)));
  expect(tree.root.findByType(FolkBoardView).props.canLock).toBe(false);
  act(() => tree.unmount());
  expect(mockRouter.replace).not.toHaveBeenCalled();
});
test('final authority result routes immediately; late action completion after unmount is ignored', async () => {
  const action = deferred<RoomProjection>();
  mockClient.snapshot.mockResolvedValue(snapshot()); mockClient.action.mockReturnValue(action.promise);
  let tree!: ReturnType<typeof create>;
  await act(async () => { tree = create(<OnlineBoardScreen />); });
  act(() => { void tree.root.findByType(FolkBoardView).props.onLock('a'); tree.unmount(); });
  await act(async () => action.resolve(snapshot(2, 'MATCH_RESULT')));
  expect(mockRouter.replace).not.toHaveBeenCalled();
  mockClient.snapshot.mockResolvedValue(snapshot(3, 'MATCH_RESULT'));
  await act(async () => { tree = create(<OnlineBoardScreen />); });
  expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/result', params: { roomCode: 'ABCDE', sessionId: 'a' } });
  act(() => tree.unmount());
});

test('resume releases an unresolved action without allowing its completion to clear a newer busy owner', async () => {
  const old = deferred<RoomProjection>(); const next = deferred<RoomProjection>();
  mockClient.snapshot.mockResolvedValue(snapshot(1));
  mockClient.action.mockReturnValueOnce(old.promise).mockReturnValueOnce(next.promise);
  let tree!: ReturnType<typeof create>;
  await act(async () => { tree = create(<OnlineBoardScreen />); });
  act(() => { void tree.root.findByType(FolkBoardView).props.onLock('a'); });
  expect(tree.root.findByType(FolkBoardView).props.busy).toBe(true);
  act(() => mockAppStateChange('background'));
  await act(async () => mockAppStateChange('active'));
  expect(tree.root.findByType(FolkBoardView).props.busy).toBe(false);
  act(() => { void tree.root.findByType(FolkBoardView).props.onLock('a'); });
  expect(mockClient.action).toHaveBeenCalledTimes(2);
  await act(async () => old.resolve(snapshot(2)));
  expect(tree.root.findByType(FolkBoardView).props.busy).toBe(true);
  await act(async () => next.resolve(snapshot(3)));
  expect(tree.root.findByType(FolkBoardView).props.busy).toBe(false);
  act(() => tree.unmount());
});
