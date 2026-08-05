import { createInterstitialGate, type AdOutcome } from './interstitial-gate';

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
});
