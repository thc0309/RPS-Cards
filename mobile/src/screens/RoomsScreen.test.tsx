import React from 'react';
import { act, create } from 'react-test-renderer';
import { RoomsScreen } from './RoomsScreen';

const mockReplace = jest.fn();
const mockCreateRoom = jest.fn();
let mockParams: { error?: string } = {};
let mockCredential: { roomCode: string; sessionId: string; reconnectToken: string } | null = null;

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ replace: mockReplace }),
}));
jest.mock('../store/app-store', () => ({ useAppStore: (select: (state: { locale: string; setActiveRoom: () => void }) => unknown) => select({ locale: 'vi', setActiveRoom: jest.fn() }) }));
jest.mock('../security/reconnect-credential', () => ({
  readReconnectCredential: () => Promise.resolve(mockCredential),
  saveReconnectCredential: jest.fn(),
}));
jest.mock('../game/room-entry', () => ({ createRoomEntryFlow: () => ({ createRoom: mockCreateRoom, joinRoom: jest.fn() }) }));
jest.mock('../game/colyseus-client', () => ({ createOnlineRoomClient: jest.fn() }));
jest.mock('../ads/interstitial-gate', () => ({ createInterstitialGate: jest.fn() }));

const textNodes = (tree: ReturnType<typeof create>, text: string) => tree.root.findAll((node) => node.props.children === text);

beforeEach(() => {
  mockParams = {};
  mockCredential = null;
  mockCreateRoom.mockReset();
  mockReplace.mockReset();
});

test('renders empty and saved-room states without changing the layout contract', async () => {
  let empty: ReturnType<typeof create>;
  await act(async () => { empty = create(<RoomsScreen />); });
  expect(textNodes(empty!, 'Chưa có phòng hiện tại').length).toBeGreaterThan(0);

  mockCredential = { roomCode: 'ABCDE', sessionId: 'guest-1', reconnectToken: 'token' };
  let saved: ReturnType<typeof create>;
  await act(async () => { saved = create(<RoomsScreen />); });
  expect(textNodes(saved!, 'ABCDE').length).toBeGreaterThan(0);
});

test('shows recoverable error and disables both mutations while busy', async () => {
  mockParams = { error: 'INVALID_CODE' };
  let finish!: (value: { ok: boolean }) => void;
  mockCreateRoom.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  let tree: ReturnType<typeof create>;
  await act(async () => { tree = create(<RoomsScreen />); });
  expect(textNodes(tree!, 'Nhập mã gồm 5 ký tự hợp lệ.').length).toBeGreaterThan(0);

  const createButton = tree!.root.findAll((node) => node.props.accessibilityLabel === 'Tạo phòng' && typeof node.props.onPress === 'function')[0];
  act(() => { createButton.props.onPress(); });
  expect(tree!.root.findAll((node) => node.props.accessibilityLabel === 'Tạo phòng' && node.props.accessibilityState?.disabled).length).toBeGreaterThan(0);
  expect(tree!.root.findAll((node) => node.props.accessibilityLabel === 'Vào phòng' && node.props.accessibilityState?.disabled).length).toBeGreaterThan(0);

  await act(async () => { finish({ ok: true }); });
});
