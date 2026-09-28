import { randomUUID } from 'node:crypto';
import { ProtocolError } from '@rps-cards/game-core';
import { allocateRoomCode } from './room-code.js';
import { OnlineRoomController } from './rooms/online-room.js';

export type RoomEntryStatus = 'available' | 'full' | 'expired';
export type RoomSession = { readonly roomCode: string; readonly sessionId: string; readonly seat: 'PLAYER_A' | 'PLAYER_B'; readonly reconnectToken: string };

const MAX_IN_MEMORY_ROOMS = 1_024;

export class RoomDirectory {
  private readonly rooms = new Map<string, OnlineRoomController>();
  constructor(private readonly options: { readonly reconnectTimeoutMs?: number; readonly draftSelectionTimeoutMs?: number; readonly roundSelectionTimeoutMs?: number } = {}) {}

  create(): { readonly roomCode: string; readonly sessionId: string; readonly reconnectToken: string } {
    this.evictClosedRooms();
    if (this.rooms.size >= MAX_IN_MEMORY_ROOMS) {
      throw new ProtocolError('INVALID_MESSAGE', 'room directory is at capacity');
    }
    const code = allocateRoomCode(new Set(this.rooms.keys()));
    const room = new OnlineRoomController(code, this.options);
    const sessionId = randomUUID();
    room.join(sessionId);
    this.rooms.set(code, room);
    return { roomCode: code, sessionId, reconnectToken: room.reconnectToken(sessionId) };
  }

  validate(roomCode: string): RoomEntryStatus {
    this.evictClosedRooms();
    const room = this.rooms.get(roomCode);
    if (!room) return 'expired';
    if (room.isClosed) return 'expired';
    return room.playerCount === 2 ? 'full' : 'available';
  }

  join(roomCode: string, sessionId: string = randomUUID()): RoomSession {
    if (sessionId.length < 1 || sessionId.length > 80) throw new ProtocolError('INVALID_MESSAGE', 'session id is invalid');
    this.evictClosedRooms();
    const room = this.rooms.get(roomCode);
    if (!room) throw new ProtocolError('ROOM_EXPIRED', 'room is not available');
    if (room.isRegisteredSession(sessionId)) {
      throw new ProtocolError('UNAUTHORIZED_SEAT', 'use reconnect to restore an existing seat');
    }
    try {
      return { roomCode, sessionId, seat: room.join(sessionId), reconnectToken: room.reconnectToken(sessionId) };
    } catch (error) {
      if (error instanceof ProtocolError) throw error;
      throw new ProtocolError('ROOM_NOT_FOUND', 'room is not available');
    }
  }

  reconnect(roomCode: string, sessionId: string, reconnectToken: string): RoomSession {
    if (sessionId.length < 1 || sessionId.length > 80 || reconnectToken.length < 1 || reconnectToken.length > 128) throw new ProtocolError('ROOM_EXPIRED', 'reconnect reservation expired');
    this.evictClosedRooms();
    const room = this.rooms.get(roomCode);
    if (!room) throw new ProtocolError('ROOM_EXPIRED', 'room is not available');
    room.reconnect(sessionId, reconnectToken);
    return { roomCode, sessionId, seat: room.join(sessionId), reconnectToken: room.reconnectToken(sessionId) };
  }

  disconnect(roomCode: string, sessionId: string): void {
    const room = this.rooms.get(roomCode);
    if (room) room.disconnect(sessionId);
  }

  leave(roomCode: string, sessionId: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    room.leave(sessionId);
    if (room.isClosed) this.removeRoom(roomCode);
  }

  get(roomCode: string): OnlineRoomController | undefined {
    this.evictClosedRooms();
    return this.rooms.get(roomCode);
  }

  private evictClosedRooms(): void {
    for (const [roomCode, room] of this.rooms) {
      if (room.isClosed) this.removeRoom(roomCode);
    }
  }

  private removeRoom(roomCode: string): void {
    const room = this.rooms.get(roomCode);
    room?.dispose();
    this.rooms.delete(roomCode);
  }
}
