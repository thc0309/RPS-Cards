import { Room, type Client } from 'colyseus';
import {
  ProtocolError,
} from '@rps-cards/game-core';
import { allocateRoomCode } from '../room-code.js';
import { RpsRoomState, type RpsRoomState as RpsRoomSchemaState } from './schema.js';
import { createRoomLog } from './logging.js';
import { OnlineRoomController } from './online-room.js';
export { OnlineRoomController } from './online-room.js';
export { RpsRoomController } from './legacy-controller.js';

export class RpsRoom extends Room<{ state: RpsRoomSchemaState }> {
  maxClients = 2;
  maxMessagesPerSecond = 20;
  private controller!: OnlineRoomController;

  onCreate(options: { roomCode?: string } = {}): void {
    const roomCode = options.roomCode ?? allocateRoomCode(new Set());
    this.controller = new OnlineRoomController(roomCode);
    this.setState(new RpsRoomState({ roomCode, rulesetVersion: 'classic_v1', phase: 'WAITING', round: 0, playerCount: 0 }));
    this.onMessage('*', (client, type, message) => this.handleMessage(client, type, message));
  }

  onJoin(client: Client): void {
    this.controller.join(client.sessionId);
    this.state.playerCount = this.clients.length;
    this.syncState(client.sessionId);
    client.send('snapshot', this.controller.projection(client.sessionId));
  }

  onLeave(client: Client): void {
    this.controller.disconnect(client.sessionId);
    this.state.playerCount = this.clients.length;
  }

  onDispose(): void { this.controller.dispose(); }

  private syncState(sessionId: string): void {
    const projection = this.controller.projection(sessionId);
    this.state.phase = projection.phase;
    this.state.round = projection.round;
  }

  private handleMessage(client: Client, _type: string | number, message: unknown): void {
    try {
      const projection = this.controller.handle(client.sessionId, message);
      this.state.phase = projection.phase;
      this.state.round = projection.round;
      client.send('snapshot', projection);
      const operationId = typeof message === 'object' && message !== null && 'operationId' in message && typeof message.operationId === 'string' ? message.operationId : 'unknown';
      console.info(JSON.stringify(createRoomLog({ event: 'action_accepted', roomCode: this.controller.roomCode, phase: this.state.phase, round: this.state.round, operationId })));
    } catch (error) {
      const operationId = typeof message === 'object' && message !== null && 'operationId' in message && typeof message.operationId === 'string' ? message.operationId : 'unknown';
      const errorCode = error instanceof ProtocolError ? error.code : 'INVALID_MESSAGE';
      console.info(JSON.stringify(createRoomLog({ event: 'action_rejected', roomCode: this.controller.roomCode, phase: this.state.phase, round: this.state.round, operationId, errorCode })));
      throw error;
    }
  }
}
