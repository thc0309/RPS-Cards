import { Image, Pressable, StyleSheet, Text, View, type AccessibilityActionEvent, type AccessibilityActionInfo, type GestureResponderEvent, type ImageSourcePropType, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import type { CardKind } from '@rps-cards/game-core';
import { folkAssets } from '../ui/folk-assets';

const art: Record<CardKind, ImageSourcePropType> = { ROCK: folkAssets.cards.rock, PAPER: folkAssets.cards.paper, SCISSORS: folkAssets.cards.scissors };

export function FolkCard({ kind, label, selected, disabled, accessibilityActions, onAccessibilityAction, onPress, style }: { kind: CardKind; label: string; selected?: boolean; disabled?: boolean; accessibilityActions?: readonly AccessibilityActionInfo[]; onAccessibilityAction?: (event: AccessibilityActionEvent) => void; onPress?: (event: GestureResponderEvent) => void; style?: StyleProp<ViewStyle> }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityActions={accessibilityActions} onAccessibilityAction={onAccessibilityAction} accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress} style={[styles.card, selected && styles.selected, disabled && styles.disabled, style]}><Image source={folkAssets.cards.frame} resizeMode="stretch" style={styles.frame} /><View style={styles.cardContent}><Image source={art[kind]} resizeMode="contain" style={styles.art} /><Text adjustsFontSizeToFit minimumFontScale={0.85} numberOfLines={1} style={styles.label}>{label}</Text></View></Pressable>;
}

export function FolkCardBack({ label, style }: { label?: string; style?: StyleProp<ImageStyle> }) {
  return <Image accessibilityLabel={label} source={folkAssets.cards.back} resizeMode="stretch" style={[styles.back, style]} />;
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', backgroundColor: '#F7E6B0', borderColor: '#E3BD62', borderRadius: 12, borderWidth: 2, height: 138, justifyContent: 'center', overflow: 'hidden', width: 92 },
  cardContent: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 6, width: '100%' },
  selected: { borderColor: '#8A241A' },
  disabled: { opacity: 0.6 },
  frame: { height: '100%', left: 0, position: 'absolute', top: 0, width: '100%' },
  art: { height: '52%', width: '80%' },
  label: { color: '#43291F', fontSize: 12, fontWeight: '800', marginTop: 3, textAlign: 'center' },
  back: { height: 90, width: 60 },
});
