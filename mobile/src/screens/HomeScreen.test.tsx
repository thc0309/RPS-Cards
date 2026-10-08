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
beforeEach(() => { mockHasHydrated = true; mockWelcome.mockClear(); mockCancelScope.mockClear(); });

test('keeps Home actions localized and accessible', () => {
  let tree: ReturnType<typeof create>;
  act(() => { tree = create(<HomeScreen />); });

  const buttons = tree!.root.findAll((node) => node.props.accessibilityRole === 'button');
  expect([...new Set(buttons.map((button) => button.props.accessibilityLabel))]).toEqual(['Chơi với bot', 'Phòng online', 'Tùy chỉnh']);
  expect(buttons.every((button) => button.props.accessibilityRole === 'button')).toBe(true);
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
