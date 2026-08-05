import type { AdOutcome } from '../ads/interstitial-gate';
import { getOrCreateGuestId } from '../security/guest-identity';
import type { ReconnectCredential } from '../security/reconnect-credential';

export type RoomEntryError = 'INVALID_CODE' | 'ROOM_NOT_FOUND' | 'ROOM_FULL' | 'ROOM_EXPIRED' | 'ENTRY_FAILED';
export type RoomAvailability = 'available' | 'full' | 'expired';

export interface RoomTransport {
  readonly createRoom: (operationId: string) => Promise<{ readonly roomCode: string; readonly sessionId: string; readonly reconnectToken?: string }>;
  readonly validateRoom: (roomCode: string) => Promise<RoomAvailability>;
  readonly joinRoom: (roomCode: string, sessionId: string, operationId: string) => Promise<{ readonly roomCode: string; readonly sessionId: string; readonly seat: 'PLAYER_A' | 'PLAYER_B'; readonly reconnectToken?: string }>;
}

export interface RoomAdGate { readonly attemptInterstitial: () => Promise<AdOutcome>; }
export interface RoomEntryCallbacks { readonly openLobby: (roomCode: string, sessionId: string) => void; readonly saveCredential?: (credential: ReconnectCredential) => Promise<void>; }
export interface RoomEntryFlow {
  readonly createRoom: () => Promise<RoomEntryResult>;
  readonly joinRoom: (rawCode: string) => Promise<RoomEntryResult>;
  readonly isBusy: () => boolean;
}

export type RoomEntryResult =
  | { readonly ok: true; readonly roomCode: string; readonly sessionId: string; readonly reconnectToken?: string }
  | { readonly ok: false; readonly code: RoomEntryError; readonly roomCode: string };

export function normalizeRoomCode(value: string): string { return value.trim().toUpperCase(); }
export function isRoomCode(value: string): boolean { return /^[A-HJ-NP-Z2-9]{5}$/.test(value); }

export function createRoomEntryFlow(transport: RoomTransport, adGate: RoomAdGate, callbacks: RoomEntryCallbacks): RoomEntryFlow {
  let inFlight: Promise<RoomEntryResult> | null = null;
  let operation = 0;
  const run = (action: () => Promise<RoomEntryResult>): Promise<RoomEntryResult> => {
    if (inFlight) return inFlight;
    inFlight = action().finally(() => { inFlight = null; });
    return inFlight;
  };
  return {
    isBusy: () => inFlight !== null,
    createRoom: () => run(async () => {
      const operationId = `create-${++operation}`;
      await adGate.attemptInterstitial();
      try {
        const created = await transport.createRoom(operationId);
        if (created.reconnectToken && callbacks.saveCredential) await callbacks.saveCredential({ roomCode: created.roomCode, sessionId: created.sessionId, reconnectToken: created.reconnectToken });
        callbacks.openLobby(created.roomCode, created.sessionId);
        return { ok: true, roomCode: created.roomCode, sessionId: created.sessionId, reconnectToken: created.reconnectToken };
      } catch {
        return { ok: false, code: 'ENTRY_FAILED', roomCode: '' };
      }
    }),
    joinRoom: (rawCode: string) => run(async () => {
      const roomCode = normalizeRoomCode(rawCode);
      if (!isRoomCode(roomCode)) return { ok: false, code: 'INVALID_CODE', roomCode };
      const first = await transport.validateRoom(roomCode);
      if (first !== 'available') return { ok: false, code: first === 'full' ? 'ROOM_FULL' : 'ROOM_EXPIRED', roomCode };
      await adGate.attemptInterstitial();
      const second = await transport.validateRoom(roomCode);
      if (second !== 'available') return { ok: false, code: second === 'full' ? 'ROOM_FULL' : 'ROOM_EXPIRED', roomCode };
      try {
        let sessionId = `guest-${operation + 1}`;
        try { sessionId = await getOrCreateGuestId(); } catch { /* test/runtime without SecureStore; server token still protects reconnect */ }
        const joined = await transport.joinRoom(roomCode, sessionId, `join-${++operation}`);
        if (joined.reconnectToken && callbacks.saveCredential) await callbacks.saveCredential({ roomCode: joined.roomCode, sessionId: joined.sessionId, reconnectToken: joined.reconnectToken });
        callbacks.openLobby(joined.roomCode, joined.sessionId);
        return { ok: true, roomCode: joined.roomCode, sessionId: joined.sessionId, reconnectToken: joined.reconnectToken };
      } catch {
        return { ok: false, code: 'ENTRY_FAILED', roomCode };
      }
    }),
  };
}
