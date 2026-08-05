export type AdOutcome = 'shown' | 'closed' | 'failed' | 'timeout' | 'no-fill';

export interface InterstitialProvider {
  readonly attempt: (timeoutMs: number) => Promise<AdOutcome>;
}

function nativeProvider(): InterstitialProvider {
  try {
    // Keep the native import at the boundary so unit tests and web never load a native module.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const native = require('react-native-google-mobile-ads') as {
      readonly AdEventType: { readonly CLOSED: string; readonly LOADED: string; readonly ERROR: string };
      readonly InterstitialAd: { createForAdRequest: (id: string) => { addAdEventListener: (event: string, callback: (error?: unknown) => void) => () => void; load: () => void; show: () => Promise<void> } };
      readonly TestIds: { readonly INTERSTITIAL: string };
    };
    return { attempt: (timeoutMs) => new Promise<AdOutcome>((resolve) => {
      const ad = native.InterstitialAd.createForAdRequest(native.TestIds.INTERSTITIAL);
      let settled = false;
      let timer: ReturnType<typeof setTimeout> | null = null;
      const removers: (() => void)[] = [];
      const settle = (outcome: AdOutcome) => { if (!settled) { settled = true; if (timer) clearTimeout(timer); removers.forEach((remove) => remove()); resolve(outcome); } };
      removers.push(ad.addAdEventListener(native.AdEventType.LOADED, () => { void ad.show().catch(() => settle('failed')); }));
      removers.push(ad.addAdEventListener(native.AdEventType.CLOSED, () => settle('closed')));
      removers.push(ad.addAdEventListener(native.AdEventType.ERROR, () => settle('failed')));
      timer = setTimeout(() => settle('timeout'), timeoutMs);
      ad.load();
    }) };
  } catch {
    return { attempt: async () => 'no-fill' };
  }
}

export function createInterstitialGate(provider: InterstitialProvider = nativeProvider(), timeoutMs = 4_000): { readonly attemptInterstitial: () => Promise<AdOutcome> } {
  let inFlight: Promise<AdOutcome> | null = null;
  return {
    attemptInterstitial: () => {
      if (inFlight) return inFlight;
      inFlight = new Promise<AdOutcome>((resolve) => {
        const attempt = provider.attempt(timeoutMs);
        const timer = setTimeout(() => resolve('timeout'), timeoutMs);
        attempt.then(resolve).catch(() => resolve('failed')).finally(() => clearTimeout(timer));
      }).finally(() => { inFlight = null; });
      return inFlight;
    },
  };
}

export const interstitialGate = createInterstitialGate();
