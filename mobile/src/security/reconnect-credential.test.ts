import { deleteReconnectCredential, readReconnectCredential, reconnectCredentialStorageKey, saveReconnectCredential } from './reconnect-credential';

test('stores only the reconnect credential in SecureStore', async () => {
  const data = new Map<string, string>();
  const storage = {
    getItemAsync: async (key: string) => data.get(key) ?? null,
    setItemAsync: async (key: string, value: string) => { data.set(key, value); },
    deleteItemAsync: async (key: string) => { data.delete(key); },
  };
  const value = { roomCode: 'ABCD2', sessionId: 'guest-1', reconnectToken: 'secret' } as const;
  await saveReconnectCredential(value, storage);
  expect(await readReconnectCredential(storage)).toEqual(value);
  expect([...data.keys()]).toEqual([reconnectCredentialStorageKey]);
  await deleteReconnectCredential(storage);
  expect(await readReconnectCredential(storage)).toBeNull();
});
