import { createRoomEntryFlow } from './room-entry';

describe('room entry flow', () => {
  const createHarness = (availability: readonly ('available' | 'full' | 'expired')[] = ['available', 'available']) => {
    const calls: string[] = [];
    let index = 0;
    const flow = createRoomEntryFlow({
      createRoom: async () => { calls.push('create'); return { roomCode: 'ABCD2', sessionId: 's-a' }; },
      validateRoom: async () => { calls.push('validate'); return availability[index++] ?? 'available'; },
      joinRoom: async () => { calls.push('join'); return { roomCode: 'ABCD2', sessionId: 's-b', seat: 'PLAYER_B' }; },
    }, { attemptInterstitial: async () => { calls.push('ad'); return 'closed'; } }, { openLobby: () => calls.push('lobby') });
    return { flow, calls };
  };

  it('creates as ad then create then lobby', async () => {
    const { flow, calls } = createHarness();
    await expect(flow.createRoom()).resolves.toMatchObject({ ok: true });
    expect(calls).toEqual(['ad', 'create', 'lobby']);
  });

  it('joins validate, ad, revalidate, join and retains invalid input', async () => {
    const { flow, calls } = createHarness();
    await expect(flow.joinRoom('abcd2')).resolves.toMatchObject({ ok: true, roomCode: 'ABCD2' });
    expect(calls).toEqual(['validate', 'ad', 'validate', 'join', 'lobby']);
    await expect(flow.joinRoom('bad')).resolves.toEqual({ ok: false, code: 'INVALID_CODE', roomCode: 'BAD' });
    expect(calls).toHaveLength(5);
  });

  it.each([
    [['full'], 'ROOM_FULL'], [['expired'], 'ROOM_EXPIRED'],
  ] as const)('keeps user on Rooms for %s', async (availability, code) => {
    const { flow, calls } = createHarness(availability);
    await expect(flow.joinRoom('ABCD2')).resolves.toMatchObject({ ok: false, code });
    expect(calls).toEqual(['validate']);
  });

  it('deduplicates rapid create taps', async () => {
    const { flow, calls } = createHarness();
    const first = flow.createRoom();
    const second = flow.createRoom();
    expect(first).toBe(second);
    await first;
    expect(calls).toEqual(['ad', 'create', 'lobby']);
  });
});
