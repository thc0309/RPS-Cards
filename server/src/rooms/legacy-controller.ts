import { ProtocolError, validateClientAction, type PlayerId, type RoomProjection } from '@rps-cards/game-core';
import { buildProjection, type ProjectionPlayer, type ProjectionState } from './projection.js';

type OperationResult = { readonly fingerprint: string; readonly result: RoomProjection };

export class RpsRoomController {
  readonly roomCode: string;
  private readonly players = new Map<string, ProjectionPlayer>();
  private readonly operations = new Map<string, OperationResult>();

  constructor(roomCode: string) { this.roomCode = roomCode; }
  join(sessionId: string): PlayerId {
    const existing = this.players.get(sessionId);
    if (existing) return existing.seat;
    if (this.players.size >= 2) throw new ProtocolError('ROOM_FULL', 'room already has two players');
    const seat: PlayerId = this.players.size === 0 ? 'PLAYER_A' : 'PLAYER_B';
    this.players.set(sessionId, { seat, hand: [], draft: null, score: 0, locked: false, discards: [] });
    return seat;
  }
  leave(sessionId: string): void { this.players.delete(sessionId); }
  projection(sessionId: string): RoomProjection {
    const player = this.players.get(sessionId);
    if (!player) throw new ProtocolError('UNAUTHORIZED_SEAT', 'session is not in room');
    return buildProjection(this.snapshot(), player.seat);
  }
  handle(sessionId: string, rawAction: unknown): RoomProjection {
    const player = this.players.get(sessionId);
    if (!player) throw new ProtocolError('UNAUTHORIZED_SEAT', 'session is not in room');
    const action = validateClientAction(rawAction);
    const fingerprint = JSON.stringify(action);
    const previous = this.operations.get(action.operationId);
    if (previous) {
      if (previous.fingerprint !== fingerprint) throw new ProtocolError('OPERATION_CONFLICT', 'operationId was reused');
      return previous.result;
    }
    const state = this.snapshot();
    if (action.expectedRound !== state.round || action.expectedPhase !== state.phase) throw new ProtocolError('STALE_OPERATION', 'phase or round no longer matches');
    if (action.type === 'LOCK_CARD') this.players.set(sessionId, { ...player, locked: true });
    const result = this.projection(sessionId);
    this.operations.set(action.operationId, { fingerprint, result });
    return result;
  }
  snapshot(): ProjectionState { return { roomCode: this.roomCode, phase: this.players.size < 2 ? 'WAITING' : 'ROUND_SELECTION', round: 1, players: [...this.players.values()] }; }
}
