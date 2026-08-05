import type { ProtocolErrorCode } from '@rps-cards/game-core';

export interface RoomLogInput {
  readonly event: 'action_accepted' | 'action_rejected';
  readonly roomCode: string;
  readonly phase: string;
  readonly round: number;
  readonly operationId: string;
  readonly errorCode?: ProtocolErrorCode;
}

export function createRoomLog(input: RoomLogInput): RoomLogInput {
  const safe: RoomLogInput = { event: input.event, roomCode: input.roomCode, phase: input.phase, round: input.round, operationId: input.operationId };
  if (input.errorCode) return { ...safe, errorCode: input.errorCode };
  return safe;
}
