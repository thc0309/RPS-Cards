import React from 'react';
import { act, create } from 'react-test-renderer';
import { HomeScreen } from './HomeScreen';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('../store/app-store', () => ({ useAppStore: (select: (state: { locale: string; hasHydrated: boolean }) => unknown) => select({ locale: 'vi', hasHydrated: true }) }));
jest.mock('../components/CustomizeSheet', () => ({ CustomizeSheet: () => null }));

test('keeps Home actions localized and accessible', () => {
  let tree: ReturnType<typeof create>;
  act(() => { tree = create(<HomeScreen />); });

  const buttons = tree!.root.findAll((node) => node.props.accessibilityRole === 'button');
  expect([...new Set(buttons.map((button) => button.props.accessibilityLabel))]).toEqual(['Chơi với bot', 'Phòng online', 'Tùy chỉnh']);
  expect(buttons.every((button) => button.props.accessibilityRole === 'button')).toBe(true);
});
