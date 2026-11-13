import React from 'react';
import { act, create } from 'react-test-renderer';
import { HomeScreen } from './HomeScreen';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
let mockHasHydrated = true;
const mockWelcome = jest.fn();
const mockCancelScope = jest.fn();
const mockFeedback = { welcome: mockWelcome, cancelScope: mockCancelScope, play: jest.fn() };
jest.mock('../ui/feedback', () => ({ useFeedback: () => mockFeedback }));
jest.mock('../store/app-store', () => ({ useAppStore: (select: (state: { locale: string; hasHydrated: boolean }) => unknown) => select({ locale: 'vi', hasHydrated: mockHasHydrated }) }));
jest.mock('../components/CustomizeSheet', () => ({ CustomizeSheet: () => null }));
jest.mock('../components/HowToPlaySheet', () => ({ HowToPlaySheet: () => null }));
beforeEach(() => { mockHasHydrated = true; mockWelcome.mockClear(); mockCancelScope.mockClear(); });

test('keeps Home actions localized and accessible', () => {
  let tree: ReturnType<typeof create>;
  act(() => { tree = create(<HomeScreen />); });

  const buttons = tree!.root.findAll((node) => node.props.accessibilityRole === 'button');
  expect([...new Set(buttons.map((button) => button.props.accessibilityLabel))]).toEqual(['Chơi với bot', 'Chơi LAN', 'Cách chơi', 'Tùy chỉnh']);
  expect(buttons.every((button) => button.props.accessibilityRole === 'button')).toBe(true);
});

test('keeps the Internet entry available only when explicitly enabled', () => {
  process.env.EXPO_PUBLIC_ONLINE_ENABLED = '1';
  let tree: ReturnType<typeof create>;
  act(() => { tree = create(<HomeScreen />); });
  expect(tree!.root.findAll((node) => node.props.accessibilityLabel === 'Phòng online').length).toBeGreaterThan(0);
  act(() => { tree!.unmount(); });
  delete process.env.EXPO_PUBLIC_ONLINE_ENABLED;
});

test('requests the root-owned welcome only after preferences hydrate', () => {
  mockHasHydrated = false;
  let tree: ReturnType<typeof create>;
  act(() => { tree = create(<HomeScreen />); });
  expect(mockWelcome).not.toHaveBeenCalled();
  mockHasHydrated = true;
  act(() => { tree!.update(<HomeScreen />); });
  expect(mockWelcome).toHaveBeenCalledTimes(1);
  act(() => { tree!.update(<HomeScreen />); });
  expect(mockWelcome).toHaveBeenCalledTimes(1);
  act(() => { tree!.unmount(); });
  expect(mockCancelScope).toHaveBeenCalledWith('home-welcome');
});
