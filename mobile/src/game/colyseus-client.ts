import type { ClientAction, RoomProjection } from '@rps-cards/game-core';
import type { RoomAvailability, RoomTransport } from './room-entry';
import { readReconnectCredential, type ReconnectCredential } from '../security/reconnect-credential';

export interface OnlineRoomClient extends RoomTransport {
  readonly reconnect: (roomCode: string, sessionId: string, reconnectToken: string) => Promise<{ readonly roomCode: string; readonly sessionId: string; readonly seat: 'PLAYER_A' | 'PLAYER_B'; readonly reconnectToken: string }>;
  readonly snapshot: (roomCode: string, sessionId: string) => Promise<RoomProjection>;
  readonly action: (roomCode: string, sessionId: string, action: ClientAction) => Promise<RoomProjection>;
  readonly leave: (roomCode: string, sessionId: string) => Promise<{ readonly ok: true }>;
}

export function createOnlineRoomClient(
  baseUrl = process.env.EXPO_PUBLIC_SERVER_URL ?? 'http://127.0.0.1:2567',
  readCredential: () => Promise<ReconnectCredential | null> = readReconnectCredential,
): OnlineRoomClient {
  let credentialPromise: Promise<ReconnectCredential | null> | null = null;
  const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, { ...init, headers: { 'content-type': 'application/json', ...init.headers } });
    const body = await response.json() as T & { readonly error?: { readonly code?: string } };
    if (!response.ok) throw new Error(body.error?.code ?? 'ENTRY_FAILED');
    return body;
  };
  const authorization = async (roomCode: string, sessionId: string): Promise<Record<string, string>> => {
    const credential = await (credentialPromise ??= readCredential());
    if (!credential || credential.roomCode !== roomCode || credential.sessionId !== sessionId) throw new Error('ROOM_EXPIRED');
    return { authorization: `Bearer ${credential.reconnectToken}` };
  };
  return {
    createRoom: (operationId) => request('/rooms/create', { method: 'POST', body: JSON.stringify({ operationId }) }),
    validateRoom: async (roomCode): Promise<RoomAvailability> => (await request<{ readonly status: RoomAvailability }>('/rooms/validate', { method: 'POST', body: JSON.stringify({ roomCode }) })).status,
    joinRoom: (roomCode, sessionId, operationId) => request('/rooms/join', { method: 'POST', body: JSON.stringify({ roomCode, sessionId, operationId }) }),
    reconnect: (roomCode, sessionId, reconnectToken) => request('/rooms/reconnect', { method: 'POST', body: JSON.stringify({ roomCode, sessionId, reconnectToken }) }),
    snapshot: async (roomCode, sessionId) => request(`/rooms/${roomCode}/snapshot?sessionId=${encodeURIComponent(sessionId)}`, { headers: await authorization(roomCode, sessionId) }),
    action: async (roomCode, sessionId, action) => request(`/rooms/${roomCode}/action`, { method: 'POST', headers: await authorization(roomCode, sessionId), body: JSON.stringify({ sessionId, action }) }),
    leave: async (roomCode, sessionId) => request(`/rooms/${roomCode}/leave`, { method: 'POST', headers: await authorization(roomCode, sessionId), body: JSON.stringify({ sessionId }) }),
  };
}
