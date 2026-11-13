import TcpSocket from 'react-native-tcp-socket';
import Zeroconf from 'react-native-zeroconf';
import * as Network from 'expo-network';
import * as Crypto from 'expo-crypto';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { AppState, NativeModules, Platform } from 'react-native';
import { createLanRoomClient, createLanRpc, LanAuthority, type LanLink, type LanRpc } from './protocol';
import { isLocalIPv4, LAN_VERSION, type LanAddress, type LanInvitation } from './address';

type Socket = ReturnType<typeof TcpSocket.createConnection>;
export interface LanRoomHandle {
  readonly client: ReturnType<typeof createLanRoomClient>;
  readonly invitation: LanInvitation;
  readonly isHost: boolean;
  dispose(): void;
}
export interface DiscoveredRoom extends LanInvitation { readonly label: string }
const TYPE = 'baobuakeo';
let hosted: LanRoomHandle | undefined;
let starting: Promise<LanRoomHandle> | undefined;

function secureRandomInt(max: number): number {
  const limit = 0x100000000 - (0x100000000 % max);
  let value: number;
  do { const b = Crypto.getRandomBytes(4); value = b[0] * 0x1000000 + b[1] * 0x10000 + b[2] * 0x100 + b[3]; } while (value >= limit);
  return value % max;
}
function socketLink(socket: Socket): LanLink {
  socket.setEncoding('utf8');
  socket.on('error', () => socket.destroy());
  return {
    send: (frame) => { socket.write(frame); }, close: () => { socket.destroy(); },
    onData: (cb) => { const onData = (data: string | { toString(): string }) => cb(data.toString()); socket.on('data', onData); return () => { socket.removeListener('data', onData); }; },
    onClose: (cb) => { socket.on('close', cb); return () => { socket.removeListener('close', cb); }; },
  };
}
async function localIPv4(): Promise<string> {
  const state = await Network.getNetworkStateAsync().catch(() => undefined);
  const wifiIP = state?.type === Network.NetworkStateType.WIFI ? await Network.getIpAddressAsync().catch(() => '') : '';
  const interfaceIP = Platform.OS === 'android' ? await NativeModules.RpsLanNetwork?.getLocalIPv4().catch(() => '') : '';
  const ip = interfaceIP || wifiIP;
  if (!isLocalIPv4(ip)) throw new Error('NO_LOCAL_IP');
  return ip;
}

export function startLanHost(): Promise<LanRoomHandle> {
  if (hosted) return Promise.resolve(hosted);
  if (starting) return starting;
  starting = createHost().finally(() => { starting = undefined; });
  return starting;
}
async function createHost(): Promise<LanRoomHandle> {
  const host = await localIPv4();
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const roomCode = Array.from({ length: 5 }, () => alphabet[secureRandomInt(alphabet.length)]).join('');
  const authority = new LanAuthority(roomCode, { randomInt: secureRandomInt, randomUUID: Crypto.randomUUID });
  const server = TcpSocket.createServer((socket) => authority.accept(socketLink(socket)));
  let discovery: Zeroconf | undefined;
  try { discovery = new Zeroconf(); discovery.on('error', () => {}); } catch { /* Manual address works without discovery. */ }
  let publishedName: string | undefined;
  let disposed = false;
  let sweep: ReturnType<typeof setInterval> | undefined;
  let subscription: ReturnType<typeof AppState.addEventListener> | undefined;
  const dispose = () => {
    if (disposed) return;
    disposed = true; hosted = undefined;
    clearInterval(sweep); subscription?.remove();
    authority.dispose(); server.close();
    if (publishedName) void discovery?.unpublishService(publishedName).catch(() => undefined);
    discovery?.removeDeviceListeners();
    void deactivateKeepAwake('lan-host');
  };
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('HOST_UNREACHABLE')), 5000);
      server.on('error', () => { clearTimeout(timeout); if (hosted) dispose(); reject(new Error('HOST_UNREACHABLE')); });
      server.listen({ port: 0, host: '0.0.0.0' }, () => { clearTimeout(timeout); resolve(); });
    });
    const port = server.address()?.port;
    if (!port) throw new Error('HOST_UNREACHABLE');
    const localRpc: LanRpc = {
      request: async <T>(op: string, body: Record<string, unknown> = {}) => {
        if (AppState.currentState !== 'active') throw new Error('HOST_UNREACHABLE');
        const c = authority.hostClient;
        if (op === 'snapshot') return await c.snapshot(String(body.roomCode), String(body.sessionId)) as T;
        if (op === 'action') return await c.action(String(body.roomCode), String(body.sessionId), body.action as Parameters<typeof c.action>[2]) as T;
        if (op === 'leave') return await c.leave(String(body.roomCode), String(body.sessionId)) as T;
        if (op === 'reconnect') return await c.reconnect(String(body.roomCode), String(body.sessionId), String(body.reconnectToken)) as T;
        if (op === 'hello') return { status: authority.controller.playerCount < 2 ? 'available' : 'full' } as T;
        throw new Error('INVALID_MESSAGE');
      }, close: () => {},
    };
    const client = createLanRoomClient(localRpc, authority.hostSession, dispose);
    const handle: LanRoomHandle = { client, invitation: { host, port, roomCode }, isHost: true, dispose };
    hosted = handle;
    subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') authority.controller.disconnect(authority.hostSession.sessionId);
      else { try { authority.controller.reconnect(authority.hostSession.sessionId, authority.hostSession.reconnectToken); } catch { dispose(); } }
    });
    void activateKeepAwakeAsync('lan-host').then(() => { if (disposed) void deactivateKeepAwake('lan-host'); }).catch(() => undefined);
    const unpublish = () => { if (publishedName) { const name = publishedName; publishedName = undefined; void discovery?.unpublishService(name).catch(() => undefined); } };
    void discovery?.publishService({ type: TYPE, protocol: 'tcp', name: `BaoBuaKeo-${roomCode}`, port, txt: { version: String(LAN_VERSION), roomCode, free: '1' } }).then((service) => {
      publishedName = service.name;
      if (disposed || authority.controller.playerCount >= 2) unpublish();
    }).catch(() => undefined);
    sweep = setInterval(() => {
      if (authority.controller.playerCount >= 2 || authority.controller.isClosed) unpublish();
      if (!authority.controller.hasLivePlayers) dispose();
    }, 500);
    return handle;
  } catch (error) { dispose(); throw error; }
}

function connect(address: LanAddress): Promise<LanRpc> {
  return new Promise((resolve, reject) => {
    const socket = TcpSocket.createConnection({ host: address.host, port: address.port, connectTimeout: 3000 }, () => {
      clearTimeout(timeout); resolve(createLanRpc(socketLink(socket)));
    });
    const fail = () => { clearTimeout(timeout); socket.destroy(); reject(new Error('HOST_UNREACHABLE')); };
    const timeout = setTimeout(fail, 3500);
    socket.on('error', fail);
  });
}
export async function connectLanRoom(invitation: LanInvitation): Promise<LanRoomHandle> {
  await localIPv4();
  let rpc: LanRpc | undefined;
  let pending: Promise<LanRpc> | undefined;
  const get = () => pending ??= connect(invitation).then((next) => { rpc = next; return next; }).finally(() => { pending = undefined; });
  const proxy: LanRpc = {
    request: async <T>(op: string, body?: Record<string, unknown>) => {
      if (op === 'hello') { rpc?.close(); rpc = undefined; }
      return (rpc ?? await get()).request<T>(op, body);
    },
    close: () => { rpc?.close(); rpc = undefined; },
  };
  return { client: createLanRoomClient(proxy), invitation, isHost: false, dispose: proxy.close };
}

export function scanLanRooms(onRooms: (rooms: DiscoveredRoom[]) => void, onScanning: (scanning: boolean) => void): () => void {
  let stopped = false;
  let scanner: Zeroconf | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let expiry: ReturnType<typeof setInterval> | undefined;
  const rooms = new Map<string, { room: DiscoveredRoom; expires: number }>();
  const emit = () => { if (!stopped) onRooms([...rooms.values()].map((entry) => entry.room)); };
  const stop = () => { if (stopped) return; stopped = true; clearTimeout(timeout); clearInterval(expiry); scanner?.stop(); scanner?.removeDeviceListeners(); onScanning(false); };
  onRooms([]); onScanning(true);
  void localIPv4().then(() => {
    if (stopped) return;
    scanner = new Zeroconf();
    scanner.on('error', () => { if (!stopped) onScanning(false); });
    scanner.on('remove', (name) => { rooms.delete(name); emit(); });
    scanner.on('resolved', (service) => {
      const host = (service.ipv4 ?? service.addresses).find(isLocalIPv4);
      if (!host || service.txt.version !== String(LAN_VERSION) || service.txt.free !== '1' || !/^[A-HJ-NP-Z2-9]{5}$/.test(service.txt.roomCode) || service.port < 1 || service.port > 65535) { rooms.delete(service.name); emit(); return; }
      rooms.set(service.name, { room: { host, port: service.port, roomCode: service.txt.roomCode, label: service.name }, expires: Date.now() + 15_000 }); emit();
    });
    scanner.scan({ type: TYPE, protocol: 'tcp' });
    timeout = setTimeout(() => { scanner?.stop(); if (!stopped) onScanning(false); }, 8000);
    expiry = setInterval(() => { for (const [key, entry] of rooms) if (entry.expires < Date.now()) rooms.delete(key); emit(); }, 1000);
  }).catch(() => { if (!stopped) onScanning(false); });
  return stop;
}
