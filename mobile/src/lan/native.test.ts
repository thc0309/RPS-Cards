import { AppState, NativeModules, type AppStateStatus } from 'react-native';
import { startLanHost, scanLanRooms } from './native';

const mockClose = jest.fn();
const mockDeactivate = jest.fn();
const mockUnpublish = jest.fn(async () => null);
const mockRemove = jest.fn();
const mockStop = jest.fn();
const mockEvents = new Map<string, (event: unknown) => void>();
let mockUUID = 0;
const mockServer = { on: jest.fn(), listen: (_options: unknown, callback: () => void) => callback(), address: () => ({ port: 41234 }), close: mockClose };
jest.mock('react-native-tcp-socket', () => ({ __esModule: true, default: { createServer: () => mockServer } }));
jest.mock('react-native-zeroconf', () => ({ __esModule: true, default: class {
  on(name: string, callback: (event: unknown) => void) { mockEvents.set(name, callback); }
  publishService = async () => ({ name: 'room' });
  unpublishService = mockUnpublish;
  removeDeviceListeners = mockRemove;
  stop = mockStop;
  scan = jest.fn();
} }));
jest.mock('expo-network', () => ({ NetworkStateType: { WIFI: 'WIFI' }, getNetworkStateAsync: async () => ({ type: 'WIFI' }), getIpAddressAsync: async () => '192.168.1.23' }));
jest.mock('expo-crypto', () => ({ getRandomBytes: () => new Uint8Array(4), randomUUID: () => `secure-${++mockUUID}` }));
jest.mock('expo-keep-awake', () => ({ activateKeepAwakeAsync: async () => undefined, deactivateKeepAwake: () => mockDeactivate() }));
let listener: (state: AppStateStatus) => void;
beforeEach(() => {
  jest.useFakeTimers(); jest.clearAllMocks(); mockEvents.clear();
  AppState.currentState = 'active';
  NativeModules.RpsLanNetwork = { getLocalIPv4: async () => '192.168.1.23' };
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, cb) => { listener = cb; return { remove: mockRemove }; });
});
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });

test('one host owns listener, authority, awake tag, advertising and background reservation', async () => {
  const handle = await startLanHost();
  expect(await startLanHost()).toBe(handle);
  const session = await handle.client.createRoom('create');
  expect((await handle.client.snapshot(session.roomCode, session.sessionId)).own.seat).toBe('PLAYER_A');
  AppState.currentState = 'background'; listener('background');
  await expect(handle.client.snapshot(session.roomCode, session.sessionId)).rejects.toThrow('HOST_UNREACHABLE');
  jest.advanceTimersByTime(1000);
  AppState.currentState = 'active'; listener('active');
  expect((await handle.client.snapshot(session.roomCode, session.sessionId)).phase).toBe('WAITING');
  await handle.client.leave(session.roomCode, session.sessionId);
  expect(mockClose).toHaveBeenCalledTimes(1);
  expect(mockUnpublish).toHaveBeenCalled();
  expect(mockDeactivate).toHaveBeenCalled();
  expect(jest.getTimerCount()).toBe(0);
});

test('host background expiry disposes the listener and timers', async () => {
  const handle = await startLanHost();
  AppState.currentState = 'background'; listener('background');
  jest.advanceTimersByTime(25_001);
  expect(mockClose).toHaveBeenCalledTimes(1);
  expect(jest.getTimerCount()).toBe(0);
  handle.dispose();
});

test('discovery removes full, lost and stale entries and releases the scanner', async () => {
  const rooms = jest.fn(); const scanning = jest.fn();
  const stop = scanLanRooms(rooms, scanning);
  await jest.advanceTimersByTimeAsync(0);
  const service = { name: 'room', ipv4: ['192.168.1.24'], port: 41234, txt: { version: '1', roomCode: 'ABCD2', free: '1' } };
  mockEvents.get('resolved')!(service);
  expect(rooms.mock.lastCall![0]).toHaveLength(1);
  mockEvents.get('resolved')!({ ...service, txt: { ...service.txt, free: '0' } });
  expect(rooms.mock.lastCall![0]).toHaveLength(0);
  mockEvents.get('resolved')!(service); mockEvents.get('remove')!('room');
  expect(rooms.mock.lastCall![0]).toHaveLength(0);
  mockEvents.get('resolved')!(service); jest.advanceTimersByTime(16_001);
  expect(rooms.mock.lastCall![0]).toHaveLength(0);
  stop(); expect(mockStop).toHaveBeenCalled(); expect(mockRemove).toHaveBeenCalled();
  expect(jest.getTimerCount()).toBe(0);
});
