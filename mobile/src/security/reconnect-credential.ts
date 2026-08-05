import * as SecureStore from 'expo-secure-store';

export interface ReconnectCredential {
  readonly roomCode: string;
  readonly sessionId: string;
  readonly reconnectToken: string;
}

interface SecureStoreLike {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
}

const KEY = 'rps-cards.reconnect-credential';

export async function readReconnectCredential(storage: SecureStoreLike = SecureStore): Promise<ReconnectCredential | null> {
  const raw = await storage.getItemAsync(KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<ReconnectCredential>;
    if (typeof value.roomCode !== 'string' || typeof value.sessionId !== 'string' || typeof value.reconnectToken !== 'string') return null;
    return { roomCode: value.roomCode, sessionId: value.sessionId, reconnectToken: value.reconnectToken };
  } catch { return null; }
}

export function saveReconnectCredential(value: ReconnectCredential, storage: SecureStoreLike = SecureStore): Promise<void> {
  return storage.setItemAsync(KEY, JSON.stringify(value));
}

export function deleteReconnectCredential(storage: SecureStoreLike = SecureStore): Promise<void> {
  return storage.deleteItemAsync(KEY);
}

export const reconnectCredentialStorageKey = KEY;
