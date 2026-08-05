import { randomUUID } from 'node:crypto';
import { ProtocolError } from '@rps-cards/game-core';
import { allocateRoomCode } from './room-code.js';
import { OnlineRoomController } from './rooms/online-room.js';

export type RoomEntryStatus = 'available' | 'full' | 'expired';
export type RoomSession = { readonly roomCode: string; readonly sessionId: string; readonly seat: 'PLAYER_A' | 'PLAYER_B'; readonly reconnectToken: string };

export class RoomDirectory {
  private readonly rooms = new Map<string, OnlineRoomController>();
  constructor(private readonly options: { readonly reconnectTimeoutMs?: number } = {}) {}

  create(): { readonly roomCode: string; readonly sessionId: string; readonly reconnectToken: string } {
    const code = allocateRoomCode(new Set(this.rooms.keys()));
    const room = new OnlineRoomController(code, this.options.reconnectTimeoutMs === undefined ? {} : { reconnectTimeoutMs: this.options.reconnectTimeoutMs });
    const sessionId = randomUUID();
    room.join(sessionId);
    this.rooms.set(code, room);
    return { roomCode: code, sessionId, reconnectToken: room.reconnectToken(sessionId) };
  }

  validate(roomCode: string): RoomEntryStatus {
    const room = this.rooms.get(roomCode);
    if (!room) return 'expired';
    return room.playerCount === 2 ? 'full' : 'available';
  }

  join(roomCode: string, sessionId: string = randomUUID()): RoomSession {
    if (sessionId.length < 1 || sessionId.length > 80) throw new ProtocolError('INVALID_MESSAGE', 'session id is invalid');
    const room = this.rooms.get(roomCode);
    if (!room) throw new ProtocolError('ROOM_EXPIRED', 'room is not available');
    try {
      return { roomCode, sessionId, seat: room.join(sessionId), reconnectToken: room.reconnectToken(sessionId) };
    } catch (error) {
      if (error instanceof ProtocolError && error.code === 'ROOM_FULL') throw error;
      throw new ProtocolError('ROOM_NOT_FOUND', 'room is not available');
    }
  }

  reconnect(roomCode: string, sessionId: string, reconnectToken: string): RoomSession {
    if (sessionId.length < 1 || sessionId.length > 80 || reconnectToken.length < 1 || reconnectToken.length > 128) throw new ProtocolError('ROOM_EXPIRED', 'reconnect reservation expired');
    const room = this.rooms.get(roomCode);
    if (!room) throw new ProtocolError('ROOM_EXPIRED', 'room is not available');
    room.reconnect(sessionId, reconnectToken);
    return { roomCode, sessionId, seat: room.join(sessionId), reconnectToken: room.reconnectToken(sessionId) };
  }

  disconnect(roomCode: string, sessionId: string): void {
    const room = this.rooms.get(roomCode);
    if (room) room.disconnect(sessionId);
  }

  get(roomCode: string): OnlineRoomController | undefined { return this.rooms.get(roomCode); }
}
