import React from 'react';
import { act, create } from 'react-test-renderer';
import { AppState, type AppStateStatus } from 'react-native';
import { ReconnectingScreen } from './ReconnectingScreen';

const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };
const mockReconnect = jest.fn();
const mockSnapshot = jest.fn();
const mockReadCredential = jest.fn();
const mockDeleteCredential = jest.fn();
const mockSetActiveRoom = jest.fn();
const mockFeedback = { play: jest.fn(), cancelScope: jest.fn() };
const listeners = new Set<(state: AppStateStatus) => void>();
const credential = { roomCode: 'ABCDE', sessionId: 'guest-1', reconnectToken: 'test-only-token' };

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ roomCode: 'ABCDE', sessionId: 'guest-1' }),
  useRouter: () => mockRouter,
}));
jest.mock('../store/app-store', () => ({ useAppStore: (select: (state: { locale: string; setActiveRoom: () => void }) => unknown) => select({ locale: 'vi', setActiveRoom: mockSetActiveRoom }) }));
jest.mock('../security/reconnect-credential', () => ({ readReconnectCredential: () => mockReadCredential(), deleteReconnectCredential: () => mockDeleteCredential() }));
jest.mock('../game/colyseus-client', () => ({ createOnlineRoomClient: () => ({ reconnect: mockReconnect, snapshot: mockSnapshot }) }));
jest.mock('../ui/feedback', () => ({ useFeedback: () => mockFeedback }));
jest.mock('../ui/motion', () => ({ ...jest.requireActual('../ui/motion'), useReducedMotion: () => true }));

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(1000);
  [mockReplace, mockReconnect, mockSnapshot, mockReadCredential, mockDeleteCredential, mockSetActiveRoom, mockFeedback.play, mockFeedback.cancelScope].forEach((mock) => mock.mockReset());
  mockReadCredential.mockResolvedValue(credential);
  mockReconnect.mockResolvedValue(undefined);
  mockSnapshot.mockResolvedValue({ phase: 'ROUND_SELECTION' });
  AppState.currentState = 'active';
  listeners.clear();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    listeners.add(listener);
    return { remove: () => { listeners.delete(listener); } };
  });
});

afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); jest.restoreAllMocks(); });

test('loss plays once through retries; confirmation requires accepted reconnect and snapshot', async () => {
  mockReconnect.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
  let tree: ReturnType<typeof create>;
  await act(async () => { tree = create(<ReconnectingScreen />); });
  expect(mockFeedback.play.mock.calls.map(([cue]) => cue)).toEqual(['connection-lost']);
  expect(mockReplace).not.toHaveBeenCalled();
  await act(async () => { jest.advanceTimersByTime(250); });
  expect(mockFeedback.play.mock.calls.map(([cue]) => cue)).toEqual(['connection-lost', 'confirm']);
  expect(mockReconnect).toHaveBeenCalledTimes(2);
  expect(mockReplace).toHaveBeenCalledWith({ pathname: '/board', params: { roomCode: 'ABCDE', sessionId: 'guest-1' } });
  act(() => { tree!.unmount(); });
  expect(listeners.size).toBe(0);
  expect(mockFeedback.cancelScope).toHaveBeenCalled();
});

test('background entry and foreground resume stay silent even when recovery completes', async () => {
  AppState.currentState = 'background';
  let finish!: () => void;
  mockReconnect.mockReturnValue(new Promise<void>((resolve) => { finish = resolve; }));
  let tree: ReturnType<typeof create>;
  await act(async () => { tree = create(<ReconnectingScreen />); });
  act(() => { AppState.currentState = 'active'; listeners.forEach((listener) => listener('active')); });
  await act(async () => { finish(); });
  expect(mockFeedback.play).not.toHaveBeenCalled();
  expect(mockReplace).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/board' }));
  act(() => { tree!.unmount(); });
});

test('background between entry and a late snapshot cancels pending loss and does not replay recovery', async () => {
  let finish!: (value: { phase: string }) => void;
  mockSnapshot.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  let tree: ReturnType<typeof create>;
  await act(async () => { tree = create(<ReconnectingScreen />); });
  act(() => { AppState.currentState = 'background'; listeners.forEach((listener) => listener('background')); });
  act(() => { AppState.currentState = 'active'; listeners.forEach((listener) => listener('active')); });
  await act(async () => { finish({ phase: 'ROUND_SELECTION' }); });
  expect(mockFeedback.play.mock.calls.map(([cue]) => cue)).toEqual(['connection-lost']);
  expect(mockFeedback.cancelScope).toHaveBeenCalled();
  act(() => { tree!.unmount(); });
});

test('expired and absent credentials keep error navigation without a false success', async () => {
  mockReconnect.mockRejectedValue(new Error('ROOM_EXPIRED'));
  let tree: ReturnType<typeof create>;
  await act(async () => { tree = create(<ReconnectingScreen />); });
  expect(mockDeleteCredential).toHaveBeenCalledTimes(1);
  expect(mockSetActiveRoom).toHaveBeenCalledWith(null);
  expect(mockReplace).toHaveBeenCalledWith({ pathname: '/rooms', params: { error: 'ROOM_EXPIRED' } });
  expect(mockFeedback.play.mock.calls.map(([cue]) => cue)).toEqual(['connection-lost']);
  act(() => { tree!.unmount(); });
  mockFeedback.play.mockClear();
  mockReadCredential.mockResolvedValue(null);
  await act(async () => { tree = create(<ReconnectingScreen />); });
  expect(mockFeedback.play).not.toHaveBeenCalled();
  act(() => { tree!.unmount(); });
});

test('unmount releases retries and ignores late success or unavailable secure storage', async () => {
  let finish!: () => void;
  mockReconnect.mockReturnValue(new Promise<void>((resolve) => { finish = resolve; }));
  let tree: ReturnType<typeof create>;
  await act(async () => { tree = create(<ReconnectingScreen />); });
  act(() => { tree!.unmount(); });
  await act(async () => { finish(); });
  expect(mockSnapshot).not.toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
  expect(listeners.size).toBe(0);
  mockReadCredential.mockRejectedValue(new Error('storage unavailable'));
  await act(async () => { tree = create(<ReconnectingScreen />); });
  expect(mockReplace).toHaveBeenCalledWith('/rooms');
  act(() => { tree!.unmount(); });
});

test('an error arriving beyond the reservation still returns to Rooms', async () => {
  let fail!: (error: Error) => void;
  mockReconnect.mockReturnValue(new Promise<void>((_resolve, reject) => { fail = reject; }));
  let tree: ReturnType<typeof create>;
  await act(async () => { tree = create(<ReconnectingScreen />); });
  jest.setSystemTime(26001);
  await act(async () => { fail(new Error('offline')); });
  expect(mockReplace).toHaveBeenCalledWith('/rooms');
  expect(mockFeedback.play.mock.calls.map(([cue]) => cue)).toEqual(['connection-lost']);
  act(() => { tree!.unmount(); });
});

test('a late expired reply after leaving cannot delete credentials or navigate', async () => {
  let fail!: (error: Error) => void;
  mockReconnect.mockReturnValue(new Promise<void>((_resolve, reject) => { fail = reject; }));
  let tree: ReturnType<typeof create>;
  await act(async () => { tree = create(<ReconnectingScreen />); });
  act(() => { tree!.unmount(); });
  await act(async () => { fail(new Error('ROOM_EXPIRED')); });
  expect(mockDeleteCredential).not.toHaveBeenCalled();
  expect(mockSetActiveRoom).not.toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
});
