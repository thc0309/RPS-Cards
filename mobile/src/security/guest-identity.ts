import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const GUEST_ID_KEY = 'rps-cards.guest-id';

interface SecureStoreLike {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
}

export async function getOrCreateGuestId(
  storage: SecureStoreLike = SecureStore,
  createId: () => string = () => Crypto.randomUUID(),
): Promise<string> {
  const existing = await storage.getItemAsync(GUEST_ID_KEY);
  if (existing) return existing;
  const id = createId();
  await storage.setItemAsync(GUEST_ID_KEY, id);
  return id;
}

export const guestIdentityStorageKey = GUEST_ID_KEY;
