import type { ClientAction, RoomProjection } from '@rps-cards/game-core';
import type { RoomAvailability, RoomTransport } from './room-entry';

export interface OnlineRoomClient extends RoomTransport {
  readonly reconnect: (roomCode: string, sessionId: string, reconnectToken: string) => Promise<{ readonly roomCode: string; readonly sessionId: string; readonly seat: 'PLAYER_A' | 'PLAYER_B'; readonly reconnectToken: string }>;
  readonly snapshot: (roomCode: string, sessionId: string) => Promise<RoomProjection>;
  readonly action: (roomCode: string, sessionId: string, action: ClientAction) => Promise<RoomProjection>;
}

export function createOnlineRoomClient(baseUrl = process.env.EXPO_PUBLIC_SERVER_URL ?? 'http://127.0.0.1:2567'): OnlineRoomClient {
  const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, { headers: { 'content-type': 'application/json' }, ...init });
    const body = await response.json() as T & { readonly error?: { readonly code?: string } };
    if (!response.ok) throw new Error(body.error?.code ?? 'ENTRY_FAILED');
    return body;
  };
  return {
    createRoom: (operationId) => request('/rooms/create', { method: 'POST', body: JSON.stringify({ operationId }) }),
    validateRoom: async (roomCode): Promise<RoomAvailability> => (await request<{ readonly status: RoomAvailability }>('/rooms/validate', { method: 'POST', body: JSON.stringify({ roomCode }) })).status,
    joinRoom: (roomCode, sessionId, operationId) => request('/rooms/join', { method: 'POST', body: JSON.stringify({ roomCode, sessionId, operationId }) }),
    reconnect: (roomCode, sessionId, reconnectToken) => request('/rooms/reconnect', { method: 'POST', body: JSON.stringify({ roomCode, sessionId, reconnectToken }) }),
    snapshot: (roomCode, sessionId) => request(`/rooms/${roomCode}/snapshot?sessionId=${encodeURIComponent(sessionId)}`),
    action: (roomCode, sessionId, action) => request(`/rooms/${roomCode}/action`, { method: 'POST', body: JSON.stringify({ sessionId, action }) }),
  };
}
