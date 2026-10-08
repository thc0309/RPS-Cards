import React from 'react';
import { AccessibilityInfo } from 'react-native';
import Animated, { getAnimatedStyle } from 'react-native-reanimated';
import { act, create } from 'react-test-renderer';
import { selectedLift, usePressMotion } from './motion';

test('reduced motion preserves selection without lift choreography', () => {
  expect(selectedLift(true)).toBe(0);
  expect(selectedLift(false)).toBe(-6);
});

test('press reaches 0.97 by 120ms, restores after cancellation and cancels when disabled', async () => {
  jest.useFakeTimers();
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  let controls: ReturnType<typeof usePressMotion>;
  let tree: ReturnType<typeof create>;
  function Probe({ disabled = false }: { disabled?: boolean }) {
    controls = usePressMotion(disabled);
    return React.createElement(Animated.View, { testID: 'press-art', style: controls.style });
  }
  await act(async () => { tree = create(React.createElement(Probe)); });
  const style = () => getAnimatedStyle(tree!.root.findAllByProps({ testID: 'press-art' }).find((node) => node.props.jestAnimatedStyle)!);
  act(() => { controls.onPressIn(); jest.advanceTimersByTime(120); });
  expect(style().transform).toEqual([{ scale: 0.97 }]);
  act(() => { controls.onPressOut(); jest.advanceTimersByTime(120); });
  expect(style().transform).toEqual([{ scale: 1 }]);
  act(() => { controls.onPressIn(); });
  act(() => { tree!.update(React.createElement(Probe, { disabled: true })); jest.advanceTimersByTime(120); });
  expect(style().transform).toEqual([{ scale: 1 }]);
  act(() => { tree!.unmount(); });
  jest.restoreAllMocks();
  jest.useRealTimers();
});

test('Reduced Motion keeps scale static and provides immediate opacity feedback', async () => {
  jest.useFakeTimers();
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  let controls: ReturnType<typeof usePressMotion>;
  let tree: ReturnType<typeof create>;
  function Probe() {
    controls = usePressMotion();
    return React.createElement(Animated.View, { testID: 'press-art', style: controls.style });
  }
  await act(async () => { tree = create(React.createElement(Probe)); });
  const style = () => getAnimatedStyle(tree!.root.findAllByProps({ testID: 'press-art' }).find((node) => node.props.jestAnimatedStyle)!);
  act(() => { controls.onPressIn(); jest.advanceTimersByTime(20); });
  expect(style().transform).toEqual([{ scale: 1 }]);
  expect(style().opacity).toBe(0.85);
  act(() => { controls.onPressOut(); jest.advanceTimersByTime(20); });
  expect(style().opacity).toBe(1);
  act(() => { tree!.unmount(); });
  jest.restoreAllMocks();
  jest.useRealTimers();
});
