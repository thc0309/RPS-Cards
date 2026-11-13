import { randomInt, randomUUID } from 'node:crypto';
import { OnlineRoomController as SharedRoomController } from '@rps-cards/game-core/room';
export type { OnlineTimerApi } from '@rps-cards/game-core/room';

// Keep the server's constructor defaults at the platform boundary.
export class OnlineRoomController extends SharedRoomController {
  constructor(roomCode: string, options: Partial<ConstructorParameters<typeof SharedRoomController>[1]> = {}) {
    super(roomCode, { ...options, randomInt: options.randomInt ?? randomInt, randomUUID: options.randomUUID ?? randomUUID });
  }
}
