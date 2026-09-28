import React from 'react';
import { act, create } from 'react-test-renderer';
import { LobbyScreen } from './LobbyScreen';

const mockReplace = jest.fn();
const mockCopy = jest.fn();
const mockLeave = jest.fn();
const mockSnapshot = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ roomCode: 'ABCDE', sessionId: 'guest-1' }),
  useRouter: () => ({ replace: mockReplace }),
}));
jest.mock('expo-clipboard', () => ({ __esModule: true, setStringAsync: (...args: unknown[]) => mockCopy(...args) }));
jest.mock('../store/app-store', () => ({ useAppStore: (select: (state: { locale: string; setActiveRoom: () => void }) => unknown) => select({ locale: 'vi', setActiveRoom: jest.fn() }) }));
jest.mock('../security/reconnect-credential', () => ({ deleteReconnectCredential: jest.fn() }));
jest.mock('../game/colyseus-client', () => ({ createOnlineRoomClient: () => ({ snapshot: mockSnapshot, leave: mockLeave }) }));

jest.useFakeTimers();

const projection = (players: number) => ({ phase: 'WAITING', players: Array.from({ length: players }, (_, index) => ({ seat: index ? 'PLAYER_B' : 'PLAYER_A' })) });
const hasText = (tree: ReturnType<typeof create>, text: string) => tree.root.findAll((node) => node.props.children === text).length > 0;

beforeEach(() => {
  mockReplace.mockReset();
  mockCopy.mockReset();
  mockLeave.mockReset();
  mockSnapshot.mockReset();
});

afterEach(() => { jest.clearAllTimers(); });

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
