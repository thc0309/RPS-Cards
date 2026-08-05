import { getOrCreateGuestId } from './guest-identity';

test('keeps guest identity in the injected secure storage boundary', async () => {
  const data = new Map<string, string>();
  const storage = {
    getItemAsync: async (key: string) => data.get(key) ?? null,
    setItemAsync: async (key: string, value: string) => { data.set(key, value); },
  };
  expect(await getOrCreateGuestId(storage, () => 'guest-1')).toBe('guest-1');
  expect(await getOrCreateGuestId(storage, () => 'guest-2')).toBe('guest-1');
  expect(data.size).toBe(1);
});
