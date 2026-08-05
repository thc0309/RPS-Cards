import type { ClientAction } from '@rps-cards/game-core';
import { createOnlineRoomClient } from './colyseus-client';

describe('online room client authorization', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('uses the stored reconnect token only as a bearer header', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ phase: 'WAITING' }) });
    global.fetch = fetchMock as typeof fetch;
    const readCredential = jest.fn(async () => ({
      roomCode: 'ABCD2',
      sessionId: 'session-a',
      reconnectToken: 'secret-token',
    }));
    const client = createOnlineRoomClient('https://game.example', readCredential);

    await client.snapshot('ABCD2', 'session-a');
    await client.action('ABCD2', 'session-a', { type: 'REMATCH_READY' } as ClientAction);
    await client.leave('ABCD2', 'session-a');

    for (const [url, init] of fetchMock.mock.calls as [string, RequestInit][]) {
      expect(url).not.toContain('secret-token');
      expect(init.body ?? '').not.toContain('secret-token');
      expect(init.headers).toMatchObject({ authorization: 'Bearer secret-token' });
    }
    expect(readCredential).toHaveBeenCalledTimes(1);
  });

  it('does not send private requests for a mismatched credential', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as typeof fetch;
    const client = createOnlineRoomClient('https://game.example', async () => ({
      roomCode: 'OTHER',
      sessionId: 'session-a',
      reconnectToken: 'secret-token',
    }));

    await expect(client.snapshot('ABCD2', 'session-a')).rejects.toThrow('ROOM_EXPIRED');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
