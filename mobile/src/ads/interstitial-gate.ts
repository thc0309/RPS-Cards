export type AdOutcome = 'shown' | 'closed' | 'failed' | 'timeout' | 'no-fill';

export interface InterstitialProvider {
  readonly attempt: () => Promise<AdOutcome>;
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
    return { attempt: () => new Promise<AdOutcome>((resolve) => {
      const ad = native.InterstitialAd.createForAdRequest(native.TestIds.INTERSTITIAL);
      let settled = false;
      const settle = (outcome: AdOutcome) => { if (!settled) { settled = true; resolve(outcome); } };
      ad.addAdEventListener(native.AdEventType.LOADED, () => { void ad.show().then(() => settle('shown')).catch(() => settle('failed')); });
      ad.addAdEventListener(native.AdEventType.CLOSED, () => settle('closed'));
      ad.addAdEventListener(native.AdEventType.ERROR, () => settle('failed'));
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
        const timer = setTimeout(() => resolve('timeout'), timeoutMs);
        provider.attempt().then(resolve).catch(() => resolve('failed')).finally(() => clearTimeout(timer));
      }).finally(() => { inFlight = null; });
      return inFlight;
    },
  };
}

export const interstitialGate = createInterstitialGate();
