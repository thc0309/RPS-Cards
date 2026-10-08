import React from 'react';
import { Modal, ScrollView, Switch } from 'react-native';
import { act, create } from 'react-test-renderer';
import { CustomizeSheet } from './CustomizeSheet';
import { useAppStore } from '../store/app-store';
import { defaultPreferences } from '../store/persistence';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null), setItem: jest.fn(async () => undefined),
}));
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'vi' }] }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));
let mockReducedMotion = false;
jest.mock('../ui/motion', () => ({ useReducedMotion: () => mockReducedMotion }));
let mockSoundPlaying = false;
let mockPendingSound = false;
jest.mock('../ui/feedback', () => ({
  useFeedback: () => ({
    settingsSoundChanged: (enabled: boolean) => {
      if (!enabled) { mockSoundPlaying = false; mockPendingSound = false; }
    },
    play: () => { mockSoundPlaying = true; },
  }),
}), { virtual: true });

let tree: ReturnType<typeof create>;
const close = jest.fn();
beforeEach(() => {
  mockReducedMotion = false;
  mockSoundPlaying = false;
  mockPendingSound = false;
  close.mockClear();
  useAppStore.setState({ ...defaultPreferences('vi'), hasHydrated: true });
});
afterEach(() => { act(() => { tree?.unmount(); }); });

test.each([
  ['vi', 'Âm thanh', 'Rung'], ['en', 'Sound', 'Vibration'],
] as const)('provides localized native switches and checked state for %s', (locale, soundLabel, vibrationLabel) => {
  useAppStore.getState().setLocale(locale);
  act(() => { tree = create(<CustomizeSheet visible onClose={close} />); });
  const switches = tree.root.findAllByType(Switch);
  expect(switches).toHaveLength(2);
  expect(switches.map((node) => [node.props.accessibilityRole, node.props.accessibilityLabel, node.props.value, node.props.accessibilityState.checked])).toEqual([
    ['switch', soundLabel, true, true], ['switch', vibrationLabel, false, false],
  ]);
});

test('mutes active and pending audio before saving OFF and never plays a preview', () => {
  act(() => { tree = create(<CustomizeSheet visible onClose={close} />); });
  mockSoundPlaying = true;
  mockPendingSound = true;
  const sound = () => tree.root.findAllByType(Switch)[0];
  let playingWhenSaved = true;
  const unsubscribe = useAppStore.subscribe((state) => { if (!state.soundEnabled) playingWhenSaved = mockSoundPlaying; });
  act(() => { sound().props.onValueChange(false); });
  expect(playingWhenSaved).toBe(false);
  expect(mockPendingSound).toBe(false);
  expect(sound().props.value).toBe(false);
  act(() => { sound().props.onValueChange(true); });
  expect(sound().props.value).toBe(true);
  expect(mockSoundPlaying).toBe(false);
  expect(mockPendingSound).toBe(false);
  unsubscribe();
});

test('keeps vibration independent of sound and Reduced Motion', () => {
  mockReducedMotion = true;
  useAppStore.getState().setSoundEnabled(false);
  act(() => { tree = create(<CustomizeSheet visible onClose={close} />); });
  act(() => { tree.root.findAllByType(Switch)[1].props.onValueChange(true); });
  expect(tree.root.findAllByType(Switch).map((node) => node.props.value)).toEqual([false, true]);
  expect(tree.root.findByType(Modal).props.animationType).toBe('none');
  expect(mockReducedMotion).toBe(true);
});

test('keeps close outside scrollable settings so long content cannot hide the action', () => {
  act(() => { tree = create(<CustomizeSheet visible onClose={close} />); });
  const content = tree.root.findByType(ScrollView);
  expect(content.findAllByType(Switch)).toHaveLength(2);
  expect(content.findAll((node) => node.props.accessibilityLabel === 'Đóng')).toHaveLength(0);
  const button = tree.root.findAll((node) => node.props.accessibilityLabel === 'Đóng')[0];
  act(() => { button.props.onPress(); });
  expect(close).toHaveBeenCalledTimes(1);
});
