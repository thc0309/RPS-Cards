import { createInterstitialGate, resolveInterstitialUnitId, type AdOutcome } from './interstitial-gate';

describe('interstitial gate', () => {
  it.each(['closed', 'failed', 'timeout', 'no-fill'] as const)('continues after %s', async (outcome: AdOutcome) => {
    const gate = createInterstitialGate({ attempt: async () => outcome });
    await expect(gate.attemptInterstitial()).resolves.toBe(outcome);
  });

  it('shares one in-flight attempt', async () => {
    let calls = 0;
    let release!: (outcome: AdOutcome) => void;
    const gate = createInterstitialGate({ attempt: () => { calls += 1; return new Promise((resolve) => { release = resolve; }); } });
    const first = gate.attemptInterstitial();
    const second = gate.attemptInterstitial();
    expect(first).toBe(second);
    release('closed');
    await expect(first).resolves.toBe('closed');
    expect(calls).toBe(1);
  });

  it('gives the provider the same timeout so native listeners can stop on time', async () => {
    let receivedTimeout = 0;
    const gate = createInterstitialGate({ attempt: async (timeoutMs: number) => { receivedTimeout = timeoutMs; return 'timeout'; } }, 123);

    await expect(gate.attemptInterstitial()).resolves.toBe('timeout');
    expect(receivedTimeout).toBe(123);
  });
});

describe('resolveInterstitialUnitId', () => {
  const real = 'ca-app-pub-1376884976470739/1234567890';
  test('uses the configured unit only in release builds', () => {
    expect(resolveInterstitialUnitId('test', real, false)).toBe(real);
    expect(resolveInterstitialUnitId('test', real, true)).toBe('test');
  });
  test('falls back to the test ad when the id is missing or malformed', () => {
    expect(resolveInterstitialUnitId('test', undefined, false)).toBe('test');
    expect(resolveInterstitialUnitId('test', '', false)).toBe('test');
    expect(resolveInterstitialUnitId('test', 'ca-app-pub-1376884976470739~4801145274', false)).toBe('test');
  });
});
