import React from 'react';
import { act, create } from 'react-test-renderer';
import { AppState, TextInput } from 'react-native';
import { RoomsScreen } from './RoomsScreen';

const mockReplace = jest.fn();
const mockCreateRoom = jest.fn();
const mockJoinRoom = jest.fn();
const mockFeedback = { play: jest.fn() };
const mockRouter = { replace: mockReplace };
const mockSetActiveRoom = jest.fn();
let mockOpenLobby: (roomCode: string, sessionId: string) => void;
let mockParams: { error?: string } = {};
let mockCredential: { roomCode: string; sessionId: string; reconnectToken: string } | null = null;

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => mockRouter,
}));
jest.mock('../store/app-store', () => ({ useAppStore: (select: (state: { locale: string; setActiveRoom: () => void }) => unknown) => select({ locale: 'vi', setActiveRoom: mockSetActiveRoom }) }));
jest.mock('../ui/feedback', () => ({ useFeedback: () => mockFeedback }));
jest.mock('../security/reconnect-credential', () => ({
  readReconnectCredential: () => Promise.resolve(mockCredential),
  saveReconnectCredential: jest.fn(),
}));
jest.mock('../game/room-entry', () => ({ createRoomEntryFlow: (_transport: unknown, _ad: unknown, callbacks: { openLobby: typeof mockOpenLobby }) => {
  mockOpenLobby = callbacks.openLobby;
  return { createRoom: mockCreateRoom, joinRoom: mockJoinRoom };
} }));
jest.mock('../game/colyseus-client', () => ({ createOnlineRoomClient: jest.fn() }));
jest.mock('../ads/interstitial-gate', () => ({ createInterstitialGate: jest.fn() }));

const textNodes = (tree: ReturnType<typeof create>, text: string) => tree.root.findAll((node) => node.props.children === text);

beforeEach(() => {
  AppState.currentState = 'active';
  mockParams = {};
  mockCredential = null;
  mockCreateRoom.mockReset();
  mockJoinRoom.mockReset();
  mockReplace.mockReset();
  mockFeedback.play.mockReset();
  mockSetActiveRoom.mockReset();
});

test('renders empty and saved-room states without changing the layout contract', async () => {
  let empty: ReturnType<typeof create>;
  await act(async () => { empty = create(<RoomsScreen />); });
  // The empty state no longer spends the best spot announcing that nothing is there.
  expect(textNodes(empty!, 'Chưa có phòng hiện tại')).toHaveLength(0);
  expect(textNodes(empty!, 'Phòng hiện tại')).toHaveLength(0);

  mockCredential = { roomCode: 'ABCDE', sessionId: 'guest-1', reconnectToken: 'token' };
  let saved: ReturnType<typeof create>;
  await act(async () => { saved = create(<RoomsScreen />); });
  expect(textNodes(saved!, 'ABCDE').length).toBeGreaterThan(0);
  act(() => { empty!.unmount(); saved!.unmount(); });
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
  act(() => { tree!.unmount(); });
});

test('keeps the hint separate from the editable five-character code', async () => {
  let tree: ReturnType<typeof create>;
  await act(async () => { tree = create(<RoomsScreen />); });
  expect(tree!.root.findByProps({ testID: 'room-code-placeholder' }).props.children).toBe('Nhập mã 5 ký tự');
  const input = tree!.root.findByType(TextInput);
  expect(input.props.maxLength).toBe(5);
  expect(input.props.accessibilityLabel).toBe('Nhập mã 5 ký tự');
  act(() => { input.props.onChangeText('ab12c'); });
  expect(tree!.root.findByType(TextInput).props.value).toBe('AB12C');
  expect(tree!.root.findAllByProps({ testID: 'room-code-placeholder' })).toHaveLength(0);
  act(() => { input.props.onChangeText(''); });
  expect(tree!.root.findByProps({ testID: 'room-code-placeholder' })).toBeDefined();
  act(() => { tree!.unmount(); });
});

test('confirms only the accepted room callback and allows it through route replacement', async () => {
  let tree: ReturnType<typeof create>;
  await act(async () => { tree = create(<RoomsScreen />); });
  expect(mockFeedback.play).not.toHaveBeenCalled();
  act(() => { mockOpenLobby('ABCDE', 'guest-1'); });
  expect(mockFeedback.play).toHaveBeenCalledTimes(1);
  expect(mockFeedback.play).toHaveBeenCalledWith('confirm', expect.objectContaining({ expiresAt: expect.any(Number) }));
  expect(mockReplace).toHaveBeenCalledWith({ pathname: '/lobby', params: { roomCode: 'ABCDE', sessionId: 'guest-1' } });
  act(() => { tree!.unmount(); });
});

test('failed join and a late callback after leaving never confirm success', async () => {
  mockJoinRoom.mockResolvedValue({ ok: false, code: 'ROOM_FULL' });
  let tree: ReturnType<typeof create>;
  await act(async () => { tree = create(<RoomsScreen />); });
  const button = tree!.root.findAll((node) => node.props.accessibilityLabel === 'Vào phòng' && typeof node.props.onPress === 'function')[0];
  await act(async () => { button.props.onPress(); });
  expect(textNodes(tree!, 'Phòng đã đủ người.').length).toBeGreaterThan(0);
  expect(mockFeedback.play).not.toHaveBeenCalled();
  act(() => { tree!.unmount(); });
  act(() => { mockOpenLobby('ABCDE', 'guest-1'); });
  expect(mockFeedback.play).not.toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
});
