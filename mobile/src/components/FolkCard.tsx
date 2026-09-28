import { Image, Pressable, StyleSheet, Text, type AccessibilityActionEvent, type AccessibilityActionInfo, type GestureResponderEvent, type ImageSourcePropType, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import type { CardKind } from '@rps-cards/game-core';
import { folkAssets } from '../ui/folk-assets';

const art: Record<CardKind, ImageSourcePropType> = { ROCK: folkAssets.cards.rock, PAPER: folkAssets.cards.paper, SCISSORS: folkAssets.cards.scissors };

export function FolkCard({ kind, label, selected, disabled, accessibilityActions, onAccessibilityAction, onPress, style }: { kind: CardKind; label: string; selected?: boolean; disabled?: boolean; accessibilityActions?: readonly AccessibilityActionInfo[]; onAccessibilityAction?: (event: AccessibilityActionEvent) => void; onPress?: (event: GestureResponderEvent) => void; style?: StyleProp<ViewStyle> }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityActions={accessibilityActions} onAccessibilityAction={onAccessibilityAction} accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress} style={[styles.card, selected && styles.selected, disabled && styles.disabled, style]}><Image source={folkAssets.cards.frame} style={styles.frame} /><Image source={art[kind]} resizeMode="contain" style={styles.art} /><Text style={styles.label}>{label}</Text></Pressable>;
}

export function FolkCardBack({ label, style }: { label?: string; style?: StyleProp<ImageStyle> }) {
  return <Image accessibilityLabel={label} source={folkAssets.cards.back} resizeMode="stretch" style={[styles.back, style]} />;
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', backgroundColor: '#F7E6B0', borderColor: '#E3BD62', borderRadius: 12, borderWidth: 2, height: 128, justifyContent: 'center', overflow: 'hidden', padding: 6, width: 82 },
  selected: { borderColor: '#8A241A' },
  disabled: { opacity: 0.6 },
  frame: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  art: { height: 68, width: 68 },
  label: { color: '#43291F', fontSize: 10, fontWeight: '800', marginTop: 3, textAlign: 'center' },
  back: { height: 90, width: 60 },
});
