import React from 'react';
import { act, create } from 'react-test-renderer';
import { AppState, type AppStateStatus } from 'react-native';
import { LobbyScreen } from './LobbyScreen';

const mockReplace = jest.fn();
const mockCopy = jest.fn();
const mockLeave = jest.fn();
const mockSnapshot = jest.fn();
const mockFeedback = { play: jest.fn() };
const mockRouter = { replace: mockReplace };
const mockSetActiveRoom = jest.fn();
const listeners = new Set<(state: AppStateStatus) => void>();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ roomCode: 'ABCDE', sessionId: 'guest-1' }),
  useRouter: () => mockRouter,
}));
jest.mock('expo-clipboard', () => ({ __esModule: true, setStringAsync: (...args: unknown[]) => mockCopy(...args) }));
jest.mock('../store/app-store', () => ({ useAppStore: (select: (state: { locale: string; setActiveRoom: () => void }) => unknown) => select({ locale: 'vi', setActiveRoom: mockSetActiveRoom }) }));
jest.mock('../ui/feedback', () => ({ useFeedback: () => mockFeedback }));
jest.mock('../ui/motion', () => ({ ...jest.requireActual('../ui/motion'), useReducedMotion: () => true }));
jest.mock('../security/reconnect-credential', () => ({ deleteReconnectCredential: jest.fn() }));
jest.mock('../game/colyseus-client', () => ({ createOnlineRoomClient: () => ({ snapshot: mockSnapshot, leave: mockLeave }) }));

jest.useFakeTimers();

const projection = (players: number) => ({ phase: 'WAITING', players: Array.from({ length: players }, (_, index) => ({ seat: index ? 'PLAYER_B' : 'PLAYER_A' })) });
const hasText = (tree: ReturnType<typeof create>, text: string) => tree.root.findAll((node) => node.props.children === text).length > 0;

beforeEach(() => {
  mockReplace.mockReset();
  mockCopy.mockReset();
  mockCopy.mockResolvedValue(undefined);
  mockLeave.mockReset();
  mockSnapshot.mockReset();
  mockFeedback.play.mockReset();
  AppState.currentState = 'active';
  listeners.clear();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    listeners.add(listener);
    return { remove: () => { listeners.delete(listener); } };
  });
});

afterEach(() => { jest.clearAllTimers(); jest.restoreAllMocks(); });

test('renders authoritative waiting and ready opponent states', async () => {
  mockSnapshot.mockResolvedValue(projection(1));
  let waiting: ReturnType<typeof create>;
  await act(async () => { waiting = create(<LobbyScreen />); });
  expect(hasText(waiting!, 'Đang chờ đối thủ…')).toBe(true);
  act(() => { waiting!.unmount(); });

  mockSnapshot.mockResolvedValue(projection(2));
  let ready: ReturnType<typeof create>;
  await act(async () => { ready = create(<LobbyScreen />); });
  expect(hasText(ready!, '✓ Đã sẵn sàng')).toBe(true);
  expect(mockFeedback.play).not.toHaveBeenCalled();
  act(() => { ready!.unmount(); });
});

test('copies the public room code', async () => {
  mockSnapshot.mockResolvedValue(projection(1));
  let tree: ReturnType<typeof create>;
  await act(async () => { tree = create(<LobbyScreen />); });
  const copy = tree!.root.findAll((node) => node.props.accessibilityLabel === 'Sao chép mã' && typeof node.props.onPress === 'function')[0];
  act(() => { copy.props.onPress(); });
  expect(mockCopy).toHaveBeenCalledWith('ABCDE');
  act(() => { tree!.unmount(); });
});

test('confirms an opponent arrival once, while identical polls stay silent', async () => {
  mockSnapshot.mockResolvedValue(projection(1));
  let tree: ReturnType<typeof create>;
  await act(async () => { tree = create(<LobbyScreen />); });
  expect(mockFeedback.play).not.toHaveBeenCalled();
  mockSnapshot.mockResolvedValue(projection(2));
  await act(async () => { jest.advanceTimersByTime(1000); });
  expect(mockFeedback.play.mock.calls.filter(([cue]) => cue === 'confirm')).toHaveLength(1);
  expect(hasText(tree!, '✓ Đã sẵn sàng')).toBe(true);
  await act(async () => { jest.advanceTimersByTime(3000); });
  expect(mockFeedback.play.mock.calls.filter(([cue]) => cue === 'confirm')).toHaveLength(1);
  act(() => { tree!.unmount(); });
});

test('background and resume seed opponent state rather than announce old readiness', async () => {
  mockSnapshot.mockResolvedValue(projection(1));
  let tree: ReturnType<typeof create>;
  await act(async () => { tree = create(<LobbyScreen />); });
  act(() => { AppState.currentState = 'background'; listeners.forEach((listener) => listener('background')); });
  mockSnapshot.mockResolvedValue(projection(2));
  await act(async () => { jest.advanceTimersByTime(1000); });
  act(() => { AppState.currentState = 'active'; listeners.forEach((listener) => listener('active')); });
  await act(async () => { jest.advanceTimersByTime(1000); });
  expect(mockFeedback.play).not.toHaveBeenCalled();
  act(() => { tree!.unmount(); });
  expect(listeners.size).toBe(0);
});
