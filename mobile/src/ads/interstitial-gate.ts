import { beginAdFeedback, endAdFeedback } from '../ui/feedback';

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
      const instance = `interstitial-${++adSequence}`;
      let settled = false;
      let retired = false;
      let showing = false;
      let timer: ReturnType<typeof setTimeout> | null = null;
      const removers: (() => void)[] = [];
      const settle = (outcome: AdOutcome) => { if (!settled) { settled = true; if (timer) clearTimeout(timer); timer = null; resolve(outcome); } };
      const retire = () => {
        if (retired) return;
        retired = true;
        removers.forEach((remove) => remove());
        settle('failed');
      };
      const close = (outcome: AdOutcome) => {
        if (retired) return;
        settle(outcome);
        retire();
        endAdFeedback(instance);
      };
      // Promise timeout releases room entry; it does not prove the full-screen ad closed.
      // CLOSED is the documented display lifetime boundary (installed Mobile Ads v15).
      removers.push(ad.addAdEventListener(native.AdEventType.LOADED, () => {
        if (retired || showing) return;
        if (!beginAdFeedback(instance, retire)) { close('no-fill'); return; }
        showing = true;
        try { void ad.show().catch(() => { if (!retired) settle('failed'); }); }
        catch { settle('failed'); }
      }));
      removers.push(ad.addAdEventListener(native.AdEventType.CLOSED, () => close('closed')));
      removers.push(ad.addAdEventListener(native.AdEventType.ERROR, () => {
        if (retired) return;
        if (showing) settle('failed'); // Show errors may be delivered after display; keep suppression.
        else close('failed');
      }));
      timer = setTimeout(() => {
        settle('timeout');
        if (!showing) retire(); // A late LOADED must not open an ad after entering the room.
      }, timeoutMs);
      try { ad.load(); } catch { close('failed'); }
    }) };
  } catch {
    return { attempt: async () => 'no-fill' };
  }
}

let adSequence = 0;

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
