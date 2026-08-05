import { schema } from '@colyseus/schema';

export const RpsRoomState = schema({
  roomCode: 'string',
  rulesetVersion: 'string',
  phase: 'string',
  round: 'number',
  playerCount: 'number',
}, 'RpsRoomState');

export type RpsRoomState = InstanceType<typeof RpsRoomState>;
