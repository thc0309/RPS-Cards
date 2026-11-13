import { LanAuthority, LanFrames, createLanRpc, createLanRoomClient, type LanLink } from './protocol';

function duplex(): [LanLink, LanLink] {
  const data = [new Set<(data: string) => void>(), new Set<(data: string) => void>()];
  const closed = [new Set<() => void>(), new Set<() => void>()];
  let done = false;
  return [0, 1].map((i) => ({
    send: (frame: string) => { if (!done) for (const cb of data[1 - i]) cb(frame); },
    close: () => { if (!done) { done = true; for (const side of closed) for (const cb of side) cb(); } },
    onData: (cb: (data: string) => void) => { data[i].add(cb); return () => { data[i].delete(cb); }; },
    onClose: (cb: () => void) => { closed[i].add(cb); return () => { closed[i].delete(cb); }; },
  })) as [LanLink, LanLink];
}

let ids = 0;
const makeAuthority = () => new LanAuthority('ABCD2', { randomInt: () => 0, randomUUID: () => `id-${++ids}` });
const connect = (host: LanAuthority) => { const [a, b] = duplex(); host.accept(a); return createLanRpc(b); };
beforeEach(() => { jest.useFakeTimers(); ids = 0; });
afterEach(() => { jest.useRealTimers(); });

test('two seats play four private rounds, rematch and cleanup with no native modules', async () => {
  const authority = makeAuthority();
  const host = authority.hostClient;
  const guest = createLanRoomClient(connect(authority));
  const a = await host.createRoom('create');
  const b = await guest.joinRoom(a.roomCode, 'untrusted-guest-id', 'join');
  expect(b.seat).toBe('PLAYER_B');
  expect(b.sessionId).not.toBe('untrusted-guest-id');
  expect((await guest.snapshot(a.roomCode, b.sessionId)).own.seat).toBe('PLAYER_B');
  expect((await host.snapshot(a.roomCode, a.sessionId)).players.every((player) => !('hand' in player))).toBe(true);
  for (let n = 0; n < 250 && (await host.snapshot(a.roomCode, a.sessionId)).phase !== 'MATCH_RESULT'; n++) {
    jest.advanceTimersByTime(500);
    await host.snapshot(a.roomCode, a.sessionId);
    await guest.snapshot(a.roomCode, b.sessionId);
  }
  const result = await guest.snapshot(a.roomCode, b.sessionId);
  expect(result.phase).toBe('MATCH_RESULT');
  expect(result.round).toBe(4);
  expect(result.own.discards).toHaveLength(4);
  await host.action(a.roomCode, a.sessionId, { type: 'REMATCH_READY', operationId: 'a-ready', expectedPhase: 'MATCH_RESULT', expectedRound: 4, payload: { ready: true } });
  await guest.action(a.roomCode, b.sessionId, { type: 'REMATCH_READY', operationId: 'b-ready', expectedPhase: 'MATCH_RESULT', expectedRound: 4, payload: { ready: true } });
  expect((await guest.snapshot(a.roomCode, b.sessionId)).phase).toBe('DRAFT_PLAYER_A');
  authority.dispose();
  expect(authority.connectionCount).toBe(0);
  expect(jest.getTimerCount()).toBe(0);
});

test('reconnect transfers socket ownership and expiry forfeits the reserved seat', async () => {
  const authority = makeAuthority();
  const a = await authority.hostClient.createRoom('create');
  const old = connect(authority);
  const guest = createLanRoomClient(old);
  const b = await guest.joinRoom(a.roomCode, '', 'join');
  old.close();
  const restored = createLanRoomClient(connect(authority));
  await restored.reconnect(b.roomCode, b.sessionId, b.reconnectToken!);
  expect((await restored.snapshot(b.roomCode, b.sessionId)).own.seat).toBe('PLAYER_B');
  restored.close();
  for (let i = 0; i < 26; i++) { jest.advanceTimersByTime(1000); await authority.hostClient.snapshot(a.roomCode, a.sessionId); }
  const result = await authority.hostClient.snapshot(a.roomCode, a.sessionId);
  expect(result.opponentLeft).toBe(true);
  expect(result.result?.winner).toBe('PLAYER_A');
  authority.dispose();
  expect(jest.getTimerCount()).toBe(0);
});

test('rejects wrong code, incompatible hello, unauthenticated access, third seat and excess sockets', async () => {
  const authority = makeAuthority();
  const rpc = connect(authority);
  await expect(rpc.request('hello', { version: 2, roomCode: 'ABCD2' })).rejects.toThrow('INCOMPATIBLE_VERSION');
  await expect(rpc.request('hello', { version: 1, roomCode: 'EFGH2' })).rejects.toThrow('WRONG_CODE');
  await expect(rpc.request('snapshot', {})).rejects.toThrow('INVALID_MESSAGE');
  const guest = createLanRoomClient(rpc);
  await guest.joinRoom('ABCD2', '', 'join');
  await expect(rpc.request('snapshot', { roomCode: 'ABCD2', sessionId: authority.hostSession.sessionId, reconnectToken: 'bad' })).rejects.toThrow('ROOM_EXPIRED');
  await expect(createLanRoomClient(connect(authority)).joinRoom('ABCD2', '', 'third')).rejects.toThrow('ROOM_FULL');
  connect(authority); connect(authority);
  expect(authority.connectionCount).toBe(4);
  authority.dispose();
  expect(jest.getTimerCount()).toBe(0);
});

test('rejects oversized/malformed frames and rate floods; idle sockets expire', async () => {
  const authority = makeAuthority();
  const [server, client] = duplex();
  authority.accept(server);
  const closed = jest.fn(); client.onClose(closed);
  client.send('x'.repeat(16385));
  expect(closed).toHaveBeenCalledTimes(1);
  const [server2, client2] = duplex(); authority.accept(server2);
  const malformed = jest.fn(); client2.onClose(malformed); client2.send('{broken}\n');
  expect(malformed).toHaveBeenCalledTimes(1);
  const rpc = connect(authority);
  for (let i = 0; i < 20; i++) await rpc.request('hello', { version: 1, roomCode: 'ABCD2' });
  await expect(rpc.request('hello', { version: 1, roomCode: 'ABCD2' })).rejects.toThrow('RATE_LIMITED');
  jest.advanceTimersByTime(10001);
  expect(authority.connectionCount).toBe(0);
  authority.dispose(); expect(jest.getTimerCount()).toBe(0);
});

test('framing handles fragmented/coalesced messages and closes pending requests cleanly', async () => {
  const frames = new LanFrames(); const receive = jest.fn();
  frames.push('{"id":', receive);
  expect(receive).not.toHaveBeenCalled();
  frames.push('"1"}\n{"id":"2"}\n', receive);
  expect(receive.mock.calls).toEqual([[{ id: '1' }], [{ id: '2' }]]);
  const [a, b] = duplex(); const rpc = createLanRpc(a);
  const request = rpc.request('hello'); const failure = expect(request).rejects.toThrow('HOST_UNREACHABLE');
  b.close(); await failure;
  expect(jest.getTimerCount()).toBe(0);
});

test('transport preserves private draft and locked card projections', async () => {
  const authority = makeAuthority(); const a = authority.hostSession;
  const host = authority.hostClient; const guest = createLanRoomClient(connect(authority));
  const b = await guest.joinRoom(a.roomCode, '', 'join');
  await host.action(a.roomCode, a.sessionId, { type: 'DRAFT_PICK', operationId: 'a-pick', expectedPhase: 'DRAFT_PLAYER_A', expectedRound: 0, payload: { position: 0 } });
  const before = await guest.snapshot(b.roomCode, b.sessionId);
  expect(before.own.draft).not.toHaveProperty('kind');
  expect(before.own.draft).not.toHaveProperty('selectedPosition');
  await guest.action(b.roomCode, b.sessionId, { type: 'DRAFT_PICK', operationId: 'b-pick', expectedPhase: 'DRAFT_PLAYER_B', expectedRound: 0, payload: { position: 0 } });
  const cards = (await host.snapshot(a.roomCode, a.sessionId)).own.hand;
  await host.action(a.roomCode, a.sessionId, { type: 'LOCK_CARD', operationId: 'a-lock', expectedPhase: 'ROUND_SELECTION', expectedRound: 1, payload: { cardId: cards[0].id } });
  const next = await guest.snapshot(b.roomCode, b.sessionId);
  expect(next.players.find((player) => player.seat === 'PLAYER_A')).not.toHaveProperty('lockedCardId');
  expect(next.players.find((player) => player.seat === 'PLAYER_A')).not.toHaveProperty('hand');
  expect(next.own.lockedCardId).toBeNull();
  authority.dispose(); expect(jest.getTimerCount()).toBe(0);
});
