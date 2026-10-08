/* eslint-disable @typescript-eslint/no-require-imports -- Metro requires static local asset paths; native audio loads only when needed. */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState, Vibration } from 'react-native';
import { useAppStore } from '../store/app-store';

const cues = {
  'ui-tap': { source: require('../../assets/audio/ui-tap.wav'), duration: 90, priority: 0 },
  'paper-select': { source: require('../../assets/audio/paper-select.wav'), duration: 140, priority: 1 },
  'card-lock': { source: require('../../assets/audio/card-lock.wav'), duration: 130, priority: 1 },
  'paper-slide': { source: require('../../assets/audio/paper-slide.wav'), duration: 200, priority: 1 },
  confirm: { source: require('../../assets/audio/confirm.wav'), duration: 260, priority: 1 },
  tick: { source: require('../../assets/audio/tick.wav'), duration: 60, priority: 0 },
  'card-flip': { source: require('../../assets/audio/card-flip.wav'), duration: 260, priority: 1 },
  'round-win': { source: require('../../assets/audio/round-win.wav'), duration: 380, priority: 1 },
  'round-loss': { source: require('../../assets/audio/round-loss.wav'), duration: 300, priority: 1 },
  'round-draw': { source: require('../../assets/audio/round-draw.wav'), duration: 220, priority: 1 },
  'match-win': { source: require('../../assets/audio/match-win.wav'), duration: 900, priority: 2 },
  'match-loss': { source: require('../../assets/audio/match-loss.wav'), duration: 520, priority: 2 },
  'connection-lost': { source: require('../../assets/audio/connection-lost.wav'), duration: 220, priority: 1 },
} as const;

export type FeedbackCue = keyof typeof cues;
export type TerminalCue = 'match-win' | 'match-loss' | 'round-draw' | 'connection-lost';
export const feedbackCueDurationMs = (cue: FeedbackCue): number => cues[cue].duration;
type Preferences = { hasHydrated: boolean; soundEnabled: boolean; vibrationEnabled: boolean };
export type FeedbackOptions = { scope?: string; matchId?: string; expiresAt?: number };
export type MatchFeedbackObservation = { matchId: string; phase: string; cue?: TerminalCue; synced: boolean; seed?: boolean };
export type FeedbackPlayer = {
  isLoaded: boolean;
  play(): void;
  pause(): void;
  seekTo(seconds: number): Promise<void>;
  remove(): void;
  addListener(event: 'playbackStatusUpdate', listener: (status: { isLoaded: boolean; didJustFinish?: boolean }) => void): { remove(): void };
};
type NativeFeedback = {
  createPlayer(cue: FeedbackCue): FeedbackPlayer;
  setAudioMode(): Promise<void>;
  vibrate(duration: number): void;
  cancelVibration(): void;
};
const nativeFeedback: NativeFeedback = {
  createPlayer: (cue) => (require('expo-audio') as typeof import('expo-audio')).createAudioPlayer(cues[cue].source, { updateInterval: 100 }),
  setAudioMode: () => (require('expo-audio') as typeof import('expo-audio')).setAudioModeAsync({ interruptionMode: 'mixWithOthers', shouldPlayInBackground: false, allowsRecording: false, allowsBackgroundRecording: false }),
  vibrate: (duration) => Vibration.vibrate(duration),
  cancelVibration: () => Vibration.cancel(),
};
function safely(action: () => void) { try { action(); } catch { /* Optional feedback must never block an action. */ } }

/** One root owner, one request/voice, a fixed local player pool. expiresAt is the latest allowed start. */
export function createFeedbackRuntime(native: NativeFeedback = nativeFeedback) {
  type Request = FeedbackOptions & { cue: FeedbackCue; expiresAt: number; priority: number; starting: boolean; playing: boolean; timer: ReturnType<typeof setTimeout> };
  type Completion = { matchId: string; cue: TerminalCue; expiresAt: number; state: 'fresh' | 'consumed' | 'cancelled' };
  const players = new Map<FeedbackCue, { player: FeedbackPlayer; loaded: boolean; listener: { remove(): void } }>();
  let preferences: Preferences = { hasHydrated: false, soundEnabled: true, vibrationEnabled: false };
  let foreground = true;
  let disposed = false;
  let welcomeHandled = false;
  let audioReady = false;
  let audioMode: Promise<void> | null = null;
  let request: Request | null = null;
  let matchId: string | null = null;
  let phase: string | null = null;
  let terminalSeen = false;
  let completion: Completion | null = null;
  let ad: { instance: string; retire: () => void } | null = null;

  const eligible = () => !disposed && foreground && preferences.hasHydrated && preferences.soundEnabled && !ad;
  function stopRequest() {
    const previous = request;
    request = null;
    if (!previous) return;
    clearTimeout(previous.timer);
    safely(() => players.get(previous.cue)?.player.pause());
  }
  function cancelCompletion() { if (completion?.state === 'fresh') completion.state = 'cancelled'; }
  function cancelAll() { stopRequest(); cancelCompletion(); safely(native.cancelVibration); }
  function releasePlayers() {
    players.forEach(({ player, listener }) => { safely(() => listener.remove()); safely(() => player.remove()); });
    players.clear();
  }
  function current(candidate: Request) {
    return request === candidate && eligible() && Date.now() < candidate.expiresAt
      && (candidate.matchId === undefined || candidate.matchId === matchId);
  }
  async function start(candidate: Request) {
    const entry = players.get(candidate.cue);
    try {
      if (!entry || !audioReady || candidate.starting || !current(candidate)) return;
      // Android emits READY once; a warmed player may reach it before listener registration.
      entry.loaded = entry.loaded || entry.player.isLoaded;
      if (!entry.loaded) return;
      candidate.starting = true;
      await entry.player.seekTo(0);
      if (!current(candidate)) { if (request === candidate) stopRequest(); return; }
      entry.player.play();
      candidate.playing = true;
      clearTimeout(candidate.timer);
      candidate.timer = setTimeout(() => { if (request === candidate) stopRequest(); }, cues[candidate.cue].duration + 100);
    } catch { if (request === candidate) stopRequest(); }
  }
  function prepareAudio() {
    if (!audioMode) {
      audioMode = Promise.resolve().then(native.setAudioMode).then(() => { audioReady = true; }).catch((error: unknown) => { audioMode = null; throw error; });
    }
    return audioMode;
  }
  function ensurePlayer(cue: FeedbackCue) {
    if (players.has(cue)) return;
    const player = native.createPlayer(cue);
    const entry = { player, loaded: player.isLoaded, listener: { remove() {} } };
    players.set(cue, entry);
    try {
      entry.listener = player.addListener('playbackStatusUpdate', (status) => {
        if (players.get(cue) !== entry) return;
        if (status.isLoaded) entry.loaded = true;
        if (request?.cue !== cue) return;
        if (status.didJustFinish && request.playing) stopRequest();
        else if (status.isLoaded) void start(request);
      });
    } catch (error) { players.delete(cue); safely(() => player.remove()); throw error; }
  }
  function warmPlayers() {
    if (!eligible()) return;
    void prepareAudio().then(() => {
      if (!eligible()) return;
      (Object.keys(cues) as FeedbackCue[]).forEach((cue) => safely(() => ensurePlayer(cue)));
    }).catch(() => {});
  }
  function play(cue: FeedbackCue, options: FeedbackOptions = {}) {
    if (!eligible() || (options.matchId !== undefined && options.matchId !== matchId)) return;
    const expiresAt = options.expiresAt ?? Date.now() + (cues[cue].priority === 0 ? 120 : 300);
    if (Date.now() >= expiresAt || (request && request.priority > cues[cue].priority)) return;
    stopRequest();
    try {
      ensurePlayer(cue);
      const candidate: Request = { ...options, cue, expiresAt, priority: cues[cue].priority, starting: false, playing: false,
        timer: setTimeout(() => { if (request === candidate) stopRequest(); }, expiresAt - Date.now()) };
      request = candidate;
      void prepareAudio().then(() => start(candidate)).catch(() => { if (request === candidate) stopRequest(); });
    } catch { stopRequest(); }
  }
  function setMatch(nextMatchId: string | null) {
    if (nextMatchId === matchId) return;
    cancelAll(); matchId = nextMatchId; phase = null; completion = null; terminalSeen = false;
  }
  return {
    play,
    cancelScope(scope: string) { if (request?.scope === scope) stopRequest(); },
    vibrate(duration = 12) {
      if (!disposed && foreground && !ad && preferences.hasHydrated && preferences.vibrationEnabled) safely(() => native.vibrate(Math.min(Math.max(duration, 1), 30)));
    },
    setPreferences(next: Preferences) {
      preferences = next;
      if (!eligible()) cancelAll();
      else warmPlayers();
      if (!next.vibrationEnabled) safely(native.cancelVibration);
    },
    setForeground(next: boolean) {
      if (next === foreground) return;
      foreground = next; phase = null;
      // Native Expo lifecycle can restart a previously playing object; release it while backgrounded.
      if (!next) { cancelAll(); releasePlayers(); }
      else warmPlayers();
    },
    setMatch,
    observeMatch(observation: MatchFeedbackObservation) {
      setMatch(observation.matchId);
      if (!foreground || !observation.synced) { phase = null; return; }
      const previousPhase = phase;
      phase = observation.phase;
      const firstTerminal = observation.phase === 'MATCH_RESULT' && !terminalSeen;
      if (observation.phase === 'MATCH_RESULT') terminalSeen = true;
      if (firstTerminal && !observation.seed && previousPhase && previousPhase !== 'MATCH_RESULT' && observation.cue) {
        completion = { matchId: observation.matchId, cue: observation.cue, expiresAt: Date.now() + 2000, state: eligible() ? 'fresh' : 'cancelled' };
      }
    },
    consumeTerminal(targetMatchId: string, scope = 'result'): TerminalCue | null {
      if (!completion || completion.matchId !== targetMatchId || completion.state !== 'fresh') return null;
      completion.state = 'consumed';
      if (!eligible() || Date.now() >= completion.expiresAt) return null;
      play(completion.cue, { scope, matchId: targetMatchId, expiresAt: completion.expiresAt });
      if (request) request.priority = 2;
      return completion.cue;
    },
    leaveResult(targetMatchId: string) {
      if (matchId !== targetMatchId) return;
      cancelCompletion();
      if (request?.priority === 2) stopRequest();
    },
    welcome() {
      if (disposed || !preferences.hasHydrated || welcomeHandled) return;
      welcomeHandled = true;
      play('confirm', { scope: 'home-welcome', expiresAt: Date.now() + 1000 });
      if (request?.scope === 'home-welcome') request.priority = 0;
    },
    beginAd(instance: string, retire: () => void) {
      if (disposed || ad) return false;
      ad = { instance, retire }; phase = null; cancelAll(); return true;
    },
    endAd(instance: string) { if (ad?.instance === instance) { ad = null; phase = null; warmPlayers(); } },
    settingsSoundChanged(enabled: boolean) {
      // Only the actual foreground OFF→ON switch interaction may retire an uncertain ad.
      if (enabled && !preferences.soundEnabled && foreground && preferences.hasHydrated && ad) {
        const retired = ad; ad = null; phase = null; cancelAll(); safely(retired.retire);
      }
      preferences = { ...preferences, soundEnabled: enabled };
      if (!enabled) cancelAll();
      else warmPlayers();
    },
    dispose() {
      if (disposed) return;
      disposed = true; cancelAll(); completion = null; phase = null;
      if (ad) { const retired = ad; ad = null; safely(retired.retire); }
      releasePlayers();
    },
  };
}

export type FeedbackRuntime = ReturnType<typeof createFeedbackRuntime>;
const silentFeedback: FeedbackRuntime = {
  play() {}, cancelScope() {}, vibrate() {}, setPreferences() {}, setForeground() {}, setMatch() {}, observeMatch() {},
  consumeTerminal: () => null, leaveResult() {}, welcome() {}, beginAd: () => true, endAd() {}, settingsSoundChanged() {}, dispose() {},
};
const FeedbackContext = createContext<FeedbackRuntime>(silentFeedback);
let rootFeedback: FeedbackRuntime | null = null;

export function beginAdFeedback(instance: string, retire: () => void): boolean { return rootFeedback?.beginAd(instance, retire) ?? true; }
export function endAdFeedback(instance: string): void { rootFeedback?.endAd(instance); }
export function useFeedback(): FeedbackRuntime { return useContext(FeedbackContext); }

export function useTerminalFeedback(matchId: string | undefined) {
  const feedback = useFeedback();
  const [cue, setCue] = useState<TerminalCue | null>(null);
  useEffect(() => {
    setCue(matchId ? feedback.consumeTerminal(matchId) : null);
    return () => { if (matchId) feedback.leaveResult(matchId); };
  }, [feedback, matchId]);
  return cue;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [runtime, setRuntime] = useState<FeedbackRuntime | null>(null);
  useEffect(() => {
    const owner = createFeedbackRuntime();
    rootFeedback = owner;
    owner.setPreferences(useAppStore.getState());
    owner.setForeground(AppState.currentState === 'active');
    const unsubscribe = useAppStore.subscribe((state) => owner.setPreferences(state));
    const lifecycle = AppState.addEventListener('change', (state) => owner.setForeground(state === 'active'));
    setRuntime(owner);
    return () => {
      unsubscribe(); lifecycle.remove(); owner.dispose();
      if (rootFeedback === owner) rootFeedback = null;
    };
  }, []);
  return <FeedbackContext.Provider value={runtime ?? silentFeedback}>{children}</FeedbackContext.Provider>;
}
