import { createInterstitialGate } from './interstitial-gate';

type FakeAd = { listeners: Map<string, (error?: unknown) => void>; load: jest.Mock; show: jest.Mock; emit: (event: string) => void };
const mockAds: FakeAd[] = [];
let mockSuppressed: { instance: string; retire: () => void } | null = null;

jest.mock('../ui/feedback', () => ({
  beginAdFeedback: (instance: string, retire: () => void) => {
    if (mockSuppressed) return false;
    mockSuppressed = { instance, retire };
    return true;
  },
  endAdFeedback: (instance: string) => { if (mockSuppressed?.instance === instance) mockSuppressed = null; },
}));
jest.mock('react-native-google-mobile-ads', () => ({
  AdEventType: { LOADED: 'loaded', CLOSED: 'closed', ERROR: 'error' },
  TestIds: { INTERSTITIAL: 'test-ad' },
  InterstitialAd: { createForAdRequest: () => {
    const listeners = new Map<string, (mockError?: unknown) => void>();
    const ad: FakeAd = { listeners, load: jest.fn(), show: jest.fn(async () => {
      expect(mockSuppressed).not.toBeNull();
    }), emit: (event) => listeners.get(event)?.() };
    mockAds.push(ad);
    return { ...ad, addAdEventListener: (event: string, callback: (mockError?: unknown) => void) => {
      listeners.set(event, callback);
      return () => listeners.delete(event);
    } };
  } },
}));

beforeEach(() => { jest.useFakeTimers(); mockSuppressed = null; mockAds.length = 0; });
afterEach(() => { mockSuppressed?.retire(); mockSuppressed = null; jest.useRealTimers(); });

test('gate timeout releases entry while an open ad keeps suppression and close listener', async () => {
  const gate = createInterstitialGate();
  const attempt = gate.attemptInterstitial();
  mockAds[0].emit('loaded');
  await Promise.resolve();
  jest.advanceTimersByTime(4_100);
  await expect(attempt).resolves.toBe('timeout');
  expect(mockSuppressed).not.toBeNull();
  expect(mockAds[0].listeners.has('closed')).toBe(true);
  const blocked = gate.attemptInterstitial();
  mockAds[1].emit('loaded');
  await expect(blocked).resolves.toBe('no-fill');
  expect(mockAds[1].show).not.toHaveBeenCalled();
  expect(mockAds[0].show).toHaveBeenCalledTimes(1);
  mockAds[0].emit('closed');
  expect(mockSuppressed).toBeNull();
  expect(mockAds[0].listeners.size).toBe(0);
});

test('load failure cleans listeners; a late loaded event after timeout cannot show an ad', async () => {
  const gate = createInterstitialGate();
  const first = gate.attemptInterstitial();
  mockAds[0].emit('error');
  await expect(first).resolves.toBe('failed');
  expect(mockSuppressed).toBeNull();
  expect(mockAds[0].listeners.size).toBe(0);
  const second = gate.attemptInterstitial();
  jest.advanceTimersByTime(4_100);
  await expect(second).resolves.toBe('timeout');
  mockAds[1].emit('loaded');
  expect(mockAds[1].show).not.toHaveBeenCalled();
});

test('uncertain show failure remains suppressed until close or explicit recovery, stale callbacks are ignored', async () => {
  const firstGate = createInterstitialGate();
  const first = firstGate.attemptInterstitial();
  mockAds[0].show.mockRejectedValue(new Error('show failed'));
  mockAds[0].emit('loaded');
  await expect(first).resolves.toBe('failed');
  expect(mockSuppressed).not.toBeNull();
  const staleClose = mockAds[0].listeners.get('closed')!;
  const retired = mockSuppressed!;
  retired.retire(); // Called only by the runtime's verified user-interaction recovery.
  mockSuppressed = null;
  expect(mockAds[0].listeners.size).toBe(0);
  const next = createInterstitialGate().attemptInterstitial();
  mockAds[1].emit('loaded');
  const current = mockSuppressed;
  staleClose();
  expect(mockSuppressed).toBe(current);
  mockAds[1].emit('closed');
  await expect(next).resolves.toBe('closed');
  expect(mockSuppressed).toBeNull();
});
