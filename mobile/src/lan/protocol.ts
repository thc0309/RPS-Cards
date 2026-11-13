import { Buffer } from 'buffer';
import { MessageRateLimiter, OnlineRoomController } from '@rps-cards/game-core/room';
import type { OnlineRoomClient } from '../game/colyseus-client';
import { LAN_VERSION } from './address';

export interface LanLink {
  send(frame: string): void;
  close(): void;
  onData(callback: (chunk: string) => void): () => void;
  onClose(callback: () => void): () => void;
}
export interface LanRpc {
  request<T>(op: string, body?: Record<string, unknown>): Promise<T>;
  close(): void;
}
export interface LanSession { roomCode: string; sessionId: string; reconnectToken: string; seat: 'PLAYER_A' | 'PLAYER_B' }
const MAX_FRAME_BYTES = 16_384;
const frame = (value: unknown) => `${JSON.stringify(value)}\n`;
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_MESSAGE');
  return value as Record<string, unknown>;
};
const field = (value: unknown, max: number): string => {
  if (typeof value !== 'string' || value.length < 1 || value.length > max) throw new Error('INVALID_MESSAGE');
  return value;
};
const errorCode = (error: unknown): string => error && typeof error === 'object' && 'code' in error ? String(error.code) : error instanceof Error ? error.message : 'INVALID_MESSAGE';

export class LanFrames {
  private pending = '';
  push(chunk: string, receive: (value: unknown) => void): void {
    this.pending += chunk;
    let end: number;
    while ((end = this.pending.indexOf('\n')) >= 0) {
      const line = this.pending.slice(0, end);
      this.pending = this.pending.slice(end + 1);
      if (Buffer.byteLength(line, 'utf8') > MAX_FRAME_BYTES) throw new Error('FRAME_TOO_LARGE');
      receive(JSON.parse(line));
    }
    if (Buffer.byteLength(this.pending, 'utf8') > MAX_FRAME_BYTES) throw new Error('FRAME_TOO_LARGE');
  }
}

export function createLanRpc(link: LanLink): LanRpc {
  let nextId = 0;
  let closed = false;
  const pending = new Map<string, { resolve(value: unknown): void; reject(error: Error): void; timer: ReturnType<typeof setTimeout> }>();
  const frames = new LanFrames();
  let unData = () => {};
  let unClose = () => {};
  const close = () => {
    if (closed) return;
    closed = true;
    unData(); unClose();
    for (const operation of pending.values()) { clearTimeout(operation.timer); operation.reject(new Error('HOST_UNREACHABLE')); }
    pending.clear(); link.close();
  };
  unClose = link.onClose(close);
  unData = link.onData((chunk) => {
    try {
      frames.push(chunk, (raw) => {
        const response = record(raw);
        const id = field(response.id, 80);
        const operation = pending.get(id);
        if (!operation) return;
        pending.delete(id); clearTimeout(operation.timer);
        if (typeof response.error === 'string') operation.reject(new Error(response.error));
        else if ('result' in response) operation.resolve(response.result);
        else throw new Error('INVALID_MESSAGE');
      });
    } catch { close(); }
  });
  return {
    close,
    request: <T>(op: string, body: Record<string, unknown> = {}) => new Promise<T>((resolve, reject) => {
      if (closed) { reject(new Error('HOST_UNREACHABLE')); return; }
      const id = String(++nextId);
      const encoded = frame({ ...body, id, op });
      if (Buffer.byteLength(encoded) > MAX_FRAME_BYTES) { reject(new Error('FRAME_TOO_LARGE')); return; }
      const timer = setTimeout(() => { pending.delete(id); reject(new Error('HOST_UNREACHABLE')); close(); }, 3000);
      pending.set(id, { resolve: (value) => resolve(value as T), reject, timer });
      try { link.send(encoded); } catch { close(); }
    }),
  };
}

export function createLanRoomClient(rpc: LanRpc, initial?: LanSession, onLeave?: () => void): OnlineRoomClient & { close(): void } {
  let session = initial;
  const auth = (roomCode: string, sessionId: string) => {
    if (!session || session.roomCode !== roomCode || session.sessionId !== sessionId) throw new Error('ROOM_EXPIRED');
    return { roomCode, sessionId, reconnectToken: session.reconnectToken };
  };
  const hello = (roomCode: string) => rpc.request<{ status: 'available' | 'full' | 'expired' }>('hello', { version: LAN_VERSION, roomCode });
  return {
    close: () => rpc.close(),
    createRoom: async () => { if (!initial) throw new Error('ROOM_EXPIRED'); return initial; },
    validateRoom: async (roomCode) => (await hello(roomCode)).status,
    joinRoom: async (roomCode) => { await hello(roomCode); session = await rpc.request<LanSession>('join', { roomCode }); return session; },
    reconnect: async (roomCode, sessionId, reconnectToken) => { await hello(roomCode); session = await rpc.request<LanSession>('reconnect', { roomCode, sessionId, reconnectToken }); return session; },
    snapshot: (roomCode, sessionId) => rpc.request('snapshot', auth(roomCode, sessionId)),
    action: (roomCode, sessionId, action) => rpc.request('action', { ...auth(roomCode, sessionId), action }),
    leave: async (roomCode, sessionId) => { try { return await rpc.request('leave', auth(roomCode, sessionId)); } finally { rpc.close(); onLeave?.(); } },
  };
}

type Connection = { hello: boolean; sessionId?: string; close(): void };
export class LanAuthority {
  readonly controller: OnlineRoomController;
  readonly hostSession: LanSession;
  readonly hostClient: ReturnType<typeof createLanRoomClient>;
  private readonly connections = new Set<Connection>();
  private readonly owners = new Map<string, Connection>();
  private readonly uuid: () => string;
  private sweepTimer: ReturnType<typeof setTimeout> | undefined;
  private disposed = false;
  get connectionCount(): number { return this.connections.size; }

  constructor(readonly roomCode: string, options: ConstructorParameters<typeof OnlineRoomController>[1]) {
    this.uuid = options.randomUUID;
    this.controller = new OnlineRoomController(roomCode, options);
    const sessionId = this.uuid();
    this.controller.join(sessionId);
    this.hostSession = { roomCode, sessionId, reconnectToken: this.controller.reconnectToken(sessionId), seat: 'PLAYER_A' };
    const local: Connection = { hello: true, sessionId, close: () => {} };
    this.hostClient = createLanRoomClient({
      request: async <T>(op: string, body = {}) => this.execute({ ...body, op }, local) as T,
      close: () => {},
    }, this.hostSession);
    const sweep = () => { if (this.disposed) return; this.controller.sweep(); this.sweepTimer = setTimeout(sweep, 1000); };
    this.sweepTimer = setTimeout(sweep, 1000);
  }

  accept(link: LanLink): void {
    if (this.disposed || this.connections.size >= 4) { link.send(frame({ id: '0', error: 'ROOM_FULL' })); link.close(); return; }
    const limiter = new MessageRateLimiter();
    const frames = new LanFrames();
    let idle: ReturnType<typeof setTimeout>;
    let unData = () => {};
    let unClose = () => {};
    const connection: Connection = { hello: false, close: () => {
      if (!this.connections.delete(connection)) return;
      clearTimeout(idle); unData(); unClose();
      if (connection.sessionId && this.owners.get(connection.sessionId) === connection) {
        this.owners.delete(connection.sessionId); this.controller.disconnect(connection.sessionId);
      }
      link.close();
    } };
    const touch = () => { clearTimeout(idle); idle = setTimeout(connection.close, 10_000); };
    this.connections.add(connection); touch();
    unClose = link.onClose(connection.close);
    unData = link.onData((chunk) => {
      if (!this.connections.has(connection)) return;
      touch();
      try {
        frames.push(chunk, (raw) => {
          const input = record(raw);
          const id = field(input.id, 80);
          try {
            if (!limiter.allow('connection')) throw new Error('RATE_LIMITED');
            link.send(frame({ id, result: this.execute(input, connection) }));
          } catch (error) { link.send(frame({ id, error: errorCode(error) })); }
        });
      } catch { connection.close(); }
    });
  }

  private execute(input: Record<string, unknown>, connection: Connection): unknown {
    if (this.disposed) throw new Error('ROOM_EXPIRED');
    const op = field(input.op, 16);
    if (op === 'hello') {
      if (input.version !== LAN_VERSION) throw new Error('INCOMPATIBLE_VERSION');
      if (input.roomCode !== this.roomCode) throw new Error('WRONG_CODE');
      connection.hello = true;
      return { version: LAN_VERSION, roomCode: this.roomCode, status: this.controller.isClosed ? 'expired' : this.controller.playerCount >= 2 ? 'full' : 'available' };
    }
    if (!connection.hello) throw new Error('INVALID_MESSAGE');
    if (input.roomCode !== this.roomCode) throw new Error('WRONG_CODE');
    if (op === 'join') {
      if (connection.sessionId) return this.session(connection.sessionId);
      const id = this.uuid(); this.controller.join(id);
      connection.sessionId = id; this.owners.set(id, connection);
      return this.session(id);
    }
    const id = field(input.sessionId, 80);
    const token = field(input.reconnectToken, 128);
    this.controller.authorize(id, token);
    if (op === 'reconnect') {
      this.controller.reconnect(id, token);
      const previous = this.owners.get(id);
      connection.sessionId = id; this.owners.set(id, connection);
      if (previous !== connection) previous?.close();
      return this.session(id);
    }
    if (connection.sessionId !== id) throw new Error('ROOM_EXPIRED');
    if (op === 'snapshot') return this.controller.projection(id);
    if (op === 'action') return this.controller.handle(id, input.action);
    if (op === 'leave') { this.controller.leave(id); return { ok: true }; }
    throw new Error('INVALID_MESSAGE');
  }

  private session(sessionId: string): LanSession {
    return { roomCode: this.roomCode, sessionId, seat: this.controller.projection(sessionId).own.seat, reconnectToken: this.controller.reconnectToken(sessionId) };
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true; clearTimeout(this.sweepTimer);
    for (const connection of this.connections) connection.close();
    this.controller.dispose();
  }
}
