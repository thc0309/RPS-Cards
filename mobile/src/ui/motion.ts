import { AccessibilityInfo } from 'react-native';
import { useEffect, useState } from 'react';
import { cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (active) setReduced(value); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { active = false; subscription.remove(); };
  }, []);
  return reduced;
}

export function selectedLift(reducedMotion: boolean): number { return reducedMotion ? 0 : -6; }

export function usePressMotion(disabled = false) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const pressed = useSharedValue(false);
  useEffect(() => {
    cancelAnimation(scale);
    scale.set(1);
    pressed.set(false);
    return () => cancelAnimation(scale);
  }, [disabled, reducedMotion, scale, pressed]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: reducedMotion ? 1 : scale.get() }],
    opacity: reducedMotion && pressed.get() ? 0.85 : 1,
  }));
  return {
    style,
    onPressIn: () => {
      if (disabled) return;
      pressed.set(true);
      if (!reducedMotion) scale.set(withTiming(0.97, { duration: 120 }));
    },
    onPressOut: () => {
      pressed.set(false);
      scale.set(reducedMotion || disabled ? 1 : withTiming(1, { duration: 120 }));
    },
  };
}
