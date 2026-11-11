import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { AppState, Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { resolveRound, type CardKind, type RoundOutcome } from '@rps-cards/game-core';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { cancelAnimation, type SharedValue, Easing, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { FolkButton } from './FolkButton';
import { FolkCard, FolkCardBack } from './FolkCard';
import { FolkSurface } from './FolkSurface';
import { getBoardBackdropLayout } from './board-view';
import { FolkBackButton, FolkTitle } from './FolkChrome';
import { folkAssets } from '../ui/folk-assets';
import type { BoardRoundPresentation } from '../game/board-round-presentation';
import type { RoundHistoryRow } from '../ui/round-history';
import { useFeedback } from '../ui/feedback';
import { usePressMotion, useReducedMotion } from '../ui/motion';

// React Native's strict type API types View as a component; refs hold the host element.
type ViewRef = React.ComponentRef<typeof View>;

const cardArt = { ROCK: folkAssets.cards.rock, PAPER: folkAssets.cards.paper, SCISSORS: folkAssets.cards.scissors } as const;

function ScorePlaque({ score, label, color, style, compact = false }: { readonly score: number | string; readonly label: string; readonly color: 'red' | 'blue'; readonly style?: object; readonly compact?: boolean }) {
  return <ImageBackground source={color === 'red' ? folkAssets.board.scoreRed : folkAssets.board.scoreBlue} resizeMode="contain" style={[styles.scorePlaque, style]}><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.scoreLabel, compact && styles.compactScoreLabel]}>{label}</Text><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.scoreValue, compact && styles.compactScoreValue]}>{score}</Text></ImageBackground>;
}

function CardFace({ kind, label, small = false, compact = false, style }: { readonly kind: CardKind; readonly label: string; readonly small?: boolean; readonly compact?: boolean; readonly style?: StyleProp<ViewStyle> }) {
  return <View accessibilityLabel={label} style={[styles.cardFace, small && styles.cardFaceSmall, compact && (small ? styles.compactFaceSmall : styles.compactFace), style]}><Image source={folkAssets.cards.frame} resizeMode="stretch" style={styles.cardFrame} /><Image source={cardArt[kind]} resizeMode="contain" style={styles.cardArt} /></View>;
}

function DraftChoice({ position, available, disabled, selected, cardWidth, cardBackLabel, unavailableLabel, reducedMotion, reveal, onPick }: { position: number; available: boolean; disabled: boolean; selected: boolean; cardWidth: number; cardBackLabel: string; unavailableLabel: string; reducedMotion: boolean; reveal: { readonly kind: CardKind; readonly label: string } | null; onPick: (position: number) => void }) {
  const press = usePressMotion(disabled);
  const entrance = useSharedValue(1);
  useEffect(() => {
    cancelAnimation(entrance);
    entrance.set(reducedMotion ? 1 : 0);
    if (!reducedMotion) entrance.set(withDelay(position * 40, withTiming(1, { duration: 100 })));
    return () => cancelAnimation(entrance);
  }, [entrance, position, reducedMotion]);
  const entranceStyle = useAnimatedStyle(() => ({ opacity: reducedMotion ? 1 : .7 + .3 * entrance.get(), transform: [{ translateY: reducedMotion ? 0 : (1 - entrance.get()) * 8 }] }));
  const flip = useSharedValue(0);
  const revealKind = reveal?.kind ?? null;
  useEffect(() => {
    cancelAnimation(flip);
    flip.set(revealKind ? (reducedMotion ? 1 : withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) })) : 0);
    return () => cancelAnimation(flip);
  }, [flip, reducedMotion, revealKind]);
  // One squash-and-stretch flip: the back narrows away, then the face widens in.
  const backStyle = useAnimatedStyle(() => ({ opacity: flip.get() < .5 ? 1 : 0, transform: [{ scaleX: Math.max(.02, 1 - flip.get() * 2) }] }));
  const faceStyle = useAnimatedStyle(() => ({ opacity: flip.get() >= .5 ? 1 : 0, transform: [{ scaleX: Math.max(.02, flip.get() * 2 - 1) }, { scale: 1 + .06 * Math.sin(Math.PI * flip.get()) }] }));
  return <Animated.View style={entranceStyle}><Animated.View style={press.style}>
    <Pressable testID={`draft-slot-${position}`} accessibilityRole="button" accessibilityLabel={`${cardBackLabel} ${position + 1}${available ? '' : `, ${unavailableLabel}`}`} accessibilityState={{ disabled, selected }} disabled={disabled} onPressIn={press.onPressIn} onPressOut={press.onPressOut} onPress={available ? () => { if (!disabled) onPick(position); } : undefined} style={[styles.draftChoice, { width: cardWidth, height: cardWidth * 1.5 + 12 }, !available && styles.draftUnavailable, selected && styles.draftSelected, selected && reducedMotion && { transform: [{ translateY: 0 }] }]}>
      <Animated.View style={[styles.draftCardBack, backStyle]}><FolkCardBack label={cardBackLabel} style={styles.draftCardBack} /></Animated.View>
      {reveal ? <Animated.View testID="draft-reveal-card" accessibilityLiveRegion="polite" style={[StyleSheet.absoluteFill, styles.draftRevealWrap, faceStyle]}><CardFace kind={reveal.kind} label={reveal.label} style={styles.draftRevealFace} /><Text numberOfLines={1} adjustsFontSizeToFit style={styles.draftRevealText}>{reveal.label}</Text></Animated.View> : <Text style={styles.positionLabel}>{available ? position + 1 : '×'}</Text>}
    </Pressable>
  </Animated.View></Animated.View>;
}

export function FolkDraftView({ title, status, instruction, timer, cardBackLabel, unavailableLabel, positions, selectedPosition, disabled, onPick, reveal = null }: {
  readonly reveal?: { readonly kind: CardKind; readonly label: string; readonly caption: string } | null;
  readonly title: string;
  readonly status: string;
  readonly instruction: string;
  readonly timer: number;
  readonly cardBackLabel: string;
  readonly unavailableLabel: string;
  readonly positions: readonly number[];
  readonly selectedPosition: number | null;
  readonly disabled: boolean;
  readonly onPick: (position: number) => void;
}) {
  const availablePositions = new Set(positions);
  const feedback = useFeedback();
  const picking = useRef(disabled);
  useEffect(() => { picking.current = disabled; }, [disabled, positions, selectedPosition]);
  const pick = (position: number) => {
    if (picking.current || disabled || !availablePositions.has(position)) return;
    picking.current = true; feedback.play('paper-select'); onPick(position);
  };
  const reducedMotion = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const compact = height < 650;
  const cardWidth = Math.min(110, (width - 48) / 3);
  const urgent = timer > 0 && timer <= 2 && !reveal;
  const timerBadge = reveal ? null : <ImageBackground testID="draft-timer" source={folkAssets.board.timerBadge} resizeMode="contain" style={[styles.draftTimer, urgent && styles.timerUrgent]}><Text style={[styles.timerText, urgent && styles.timerUrgentText]}>{timer}s</Text></ImageBackground>;
  const revealPosition = reveal ? (selectedPosition ?? 1) : null;
  return <FolkSurface background="woven" contentStyle={styles.draftSurface}>
    <ScrollView style={styles.fullWidth} contentContainerStyle={[styles.draftContent, compact && styles.compactDraftContent]}>
    <FolkTitle style={[styles.draftTitle, compact && styles.compactDraftTitle]}>{title}</FolkTitle>
    <ImageBackground source={folkAssets.controls.paperPanel} resizeMode="stretch" imageStyle={styles.fillImage} style={styles.opponentPanel}>
      <View style={[styles.opponentPanelContent, compact && styles.compactOpponentPanel]}>
      <Image source={folkAssets.decorations.lion} resizeMode="contain" style={[styles.opponentAvatar, compact && styles.compactAvatar]} />
      <View style={styles.opponentCopy}><Text accessibilityLiveRegion="polite" style={styles.draftStatus}>{reveal ? reveal.caption : status}</Text></View>
      {timerBadge}
      </View>
    </ImageBackground>
    <View style={styles.draftCards}>
      {[0, 1, 2].map((position) => {
        const available = availablePositions.has(position);
        const slotDisabled = disabled || !available;
        return <DraftChoice key={position} position={position} available={available || revealPosition === position} disabled={slotDisabled || reveal !== null} selected={(revealPosition ?? selectedPosition) === position} cardWidth={cardWidth} cardBackLabel={cardBackLabel} unavailableLabel={unavailableLabel} reducedMotion={reducedMotion} reveal={reveal && revealPosition === position ? reveal : null} onPick={pick} />;
      })}
    </View>
    <ImageBackground source={folkAssets.board.scrollPanel} resizeMode="stretch" imageStyle={styles.fillImage} style={styles.instructionScroll}>
      <View style={[styles.instructionContent, compact && styles.compactInstruction]}><Text style={styles.instructionText}>{instruction}</Text></View>
    </ImageBackground>
    </ScrollView>
  </FolkSurface>;
}

export type BoardCard = { readonly id: string; readonly kind: CardKind; readonly extra?: boolean };

type MeasuredBounds = { readonly x: number; readonly y: number; readonly width: number; readonly height: number };

export function isCardCenterInsideDropTarget(card: MeasuredBounds, target: MeasuredBounds, translateX: number, translateY: number): boolean {
  'worklet';
  const centerX = card.x + card.width / 2 + translateX;
  const centerY = card.y + card.height / 2 + translateY;
  return centerX >= target.x && centerX <= target.x + target.width && centerY >= target.y && centerY <= target.y + target.height;
}

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

function DraggableBoardCard({ card, selected, canDrag, reducedMotion, selectedLift, target, lockLabel, label, badge, compact, onSelect, onLock }: {
  readonly badge?: string;
  readonly card: BoardCard;
  readonly selected: boolean;
  readonly canDrag: boolean;
  readonly reducedMotion: boolean;
  readonly selectedLift: number;
  readonly target: MeasuredBounds | null;
  readonly lockLabel: string;
  readonly label: string;
  readonly compact: boolean;
  readonly onSelect: (id: string) => void;
  readonly onLock: (id: string) => void;
}) {
  const cardRef = useRef<ViewRef>(null);
  const [cardBounds, setCardBounds] = useState<MeasuredBounds | null>(null);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const committed = useSharedValue(false);
  const feedback = useFeedback();
  const lift = useCallback(() => feedback.play('paper-select', { scope: 'board-hand' }), [feedback]);
  useEffect(() => () => feedback.cancelScope('board-hand'), [feedback]);

  useEffect(() => {
    const next = selected ? selectedLift : 0;
    y.set(reducedMotion ? next : withTiming(next, { duration: 150, easing: EASE_OUT }));
    if (!selected) x.set(reducedMotion ? 0 : withTiming(0, { duration: 150, easing: EASE_OUT }));
  }, [reducedMotion, selected, selectedLift, x, y]);

  const pan = useMemo(() => Gesture.Pan()
    // A card can be dragged straight from the hand; the drag itself selects it.
    .enabled(canDrag && cardBounds !== null && target !== null)
    .onBegin(() => {
      committed.set(false);
      startX.set(x.get());
      startY.set(y.get());
    })
    .onStart(() => { scheduleOnRN(onSelect, card.id); scheduleOnRN(lift); })
    .onUpdate((event) => {
      x.set(startX.get() + event.translationX);
      y.set(startY.get() + event.translationY);
    })
    .onEnd((event) => {
      if (!cardBounds || !target || !isCardCenterInsideDropTarget(cardBounds, target, x.get(), y.get())) {
        x.set(reducedMotion ? 0 : withSpring(0, { duration: 400, dampingRatio: 0.8, velocity: event.velocityX }));
        y.set(reducedMotion ? selectedLift : withSpring(selectedLift, { duration: 400, dampingRatio: 0.8, velocity: event.velocityY }));
        return;
      }
      committed.set(true);
      const targetX = target.x + target.width / 2 - cardBounds.x - cardBounds.width / 2;
      const targetY = target.y + target.height / 2 - cardBounds.y - cardBounds.height / 2;
      x.set(reducedMotion ? targetX : withSpring(targetX, { duration: 400, dampingRatio: 1, velocity: event.velocityX, overshootClamping: true }));
      y.set(reducedMotion ? targetY : withSpring(targetY, { duration: 400, dampingRatio: 1, velocity: event.velocityY, overshootClamping: true }));
      scheduleOnRN(onLock, card.id);
    })
    .onFinalize((_event, success) => {
      if (success || committed.get()) return;
      x.set(reducedMotion ? 0 : withSpring(0, { duration: 400, dampingRatio: 1 }));
      y.set(reducedMotion ? selectedLift : withSpring(selectedLift, { duration: 400, dampingRatio: 1 }));
    }), [canDrag, card.id, cardBounds, committed, lift, onLock, onSelect, reducedMotion, selectedLift, startX, startY, target, x, y]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }, { translateY: y.get() }] }));
  const measureCard = () => cardRef.current?.measureInWindow((left, top, width, height) => setCardBounds({ x: left, y: top, width, height }));

  return <View ref={cardRef} onLayout={measureCard}>
    <GestureDetector gesture={pan}>
      <Animated.View testID={`board-hand-card-${card.id}`} style={animatedStyle}>
        <FolkCard kind={card.kind} label={label} badge={badge} style={compact ? styles.compactCard : undefined} selected={selected} disabled={!canDrag} accessibilityActions={selected && canDrag ? [{ name: 'lock', label: lockLabel }] : undefined} onAccessibilityAction={selected && canDrag ? (event) => { if (event.nativeEvent.actionName === 'lock') onLock(card.id); } : undefined} onPress={() => { measureCard(); if (selected && canDrag) onLock(card.id); else onSelect(card.id); }} />
      </Animated.View>
    </GestureDetector>
  </View>;
}

function DiscardRail({ label, kinds, cardLabel, compact, railRef, testID }: { readonly label: string; readonly kinds: readonly CardKind[]; readonly cardLabel: (kind: CardKind) => string; readonly compact: boolean; readonly railRef: React.RefObject<ViewRef | null>; readonly testID: string }) {
  return <View ref={railRef} testID={testID} style={styles.discardRail}>
    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={styles.discardLabel}>{label}</Text>
    <View style={styles.discardCards}>{[0, 1, 2, 3].map((index) => {
      const kind = kinds[index];
      return kind
        ? <CardFace key={index} kind={kind} label={cardLabel(kind)} style={[styles.discardSlot, compact && styles.compactDiscardSlot]} />
        : <View key={index} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.discardSlot, styles.discardEmpty, compact && styles.compactDiscardSlot]} />;
    })}</View>
  </View>;
}

const petalDirections = [[-50, -32], [-24, -66], [24, -66], [50, -32], [28, 60], [-28, 60]] as const;

function WinPetal({ direction, compact, progress }: { readonly direction: readonly [number, number]; readonly compact: boolean; readonly progress: SharedValue<number> }) {
  const animated = useAnimatedStyle(() => {
    const t = progress.get();
    const distance = (.25 + t * .75) * (compact ? .7 : 1);
    return { opacity: Math.sin(Math.PI * t), transform: [{ translateX: direction[0] * distance }, { translateY: direction[1] * distance }, { rotate: `${direction[0] + t * 90}deg` }, { scale: .8 + Math.sin(Math.PI * t) * .3 }] };
  });
  return <Animated.View style={[styles.winPetal, animated]} />;
}

function RoundSlotCard({ kind, label, backLabel, compact, progress, facesVisible, discardProgress, destination, outcome, outcomeProgress, reducedMotion }: { readonly kind: CardKind | null; readonly label: string; readonly backLabel: string; readonly compact: boolean; readonly progress: SharedValue<number>; readonly facesVisible: boolean; readonly discardProgress: SharedValue<number>; readonly destination: React.RefObject<ViewRef | null>; readonly outcome: RoundOutcome | null; readonly outcomeProgress: SharedValue<number>; readonly reducedMotion: boolean }) {
  const ref = useRef<ViewRef>(null);
  const delta = useSharedValue({ x: 0, y: 0 });
  const measure = () => ref.current?.measureInWindow((x, y, width, height) => destination.current?.measureInWindow((dx, dy, dw, dh) => delta.set({ x: dx + dw / 2 - x - width / 2, y: dy + dh / 2 - y - height / 2 })));
  const back = useAnimatedStyle(() => ({ opacity: progress.get() < .5 ? 1 : 0, transform: [{ perspective: 800 }, { rotateY: `${progress.get() * 180}deg` }] }));
  const front = useAnimatedStyle(() => ({ opacity: progress.get() >= .5 ? 1 : 0, transform: [{ perspective: 800 }, { rotateY: `${(progress.get() - 1) * 180}deg` }] }));
  const travel = useAnimatedStyle(() => {
    const pulse = reducedMotion || !outcome ? 0 : Math.sin(Math.PI * Math.min(1, outcomeProgress.get() * 2));
    const settle = reducedMotion || outcome !== 'LOSS' ? 0 : Math.sin(Math.PI * outcomeProgress.get());
    const lift = outcome === 'WIN' ? -8 * pulse : 6 * settle;
    const scale = outcome === 'WIN' ? .08 * pulse : outcome === 'DRAW' ? .035 * pulse : 0;
    return { opacity: (1 - discardProgress.get()) * (1 - .12 * settle), transform: [{ translateX: delta.get().x * discardProgress.get() }, { translateY: delta.get().y * discardProgress.get() + lift }, { rotate: `${6 * settle}deg` }, { scale: 1 - discardProgress.get() * .5 + scale }] };
  });
  return <Animated.View ref={ref} onLayout={measure} style={[styles.slotCard, compact && styles.compactSlotCard, travel]}>
    <Animated.View accessibilityElementsHidden={facesVisible} importantForAccessibility={facesVisible ? 'no-hide-descendants' : 'auto'} style={[StyleSheet.absoluteFill, back]}><FolkCardBack label={backLabel} style={styles.slotFill} /></Animated.View>
    {kind ? <Animated.View accessibilityElementsHidden={!facesVisible} importantForAccessibility={facesVisible ? 'auto' : 'no-hide-descendants'} style={[StyleSheet.absoluteFill, front]}><CardFace kind={kind} label={label} style={styles.slotFill} /></Animated.View> : null}
    {outcome === 'WIN' ? <View testID="round-winner-outline" pointerEvents="none" style={styles.winnerCard} /> : null}
    {outcome === 'WIN' && !reducedMotion ? <View testID="round-win-petals" pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>{petalDirections.map((direction, index) => <WinPetal key={index} direction={direction} compact={compact} progress={outcomeProgress} />)}</View> : null}
  </Animated.View>;
}

export function FolkBoardView({ roundLabel, exitLabel, onExit, lockedHintLabel, slotHintLabel, extraLabel, bannerLabels, opponentName, playerName, scoreLabel, opponentScore, playerScore, opponentCardCount, opponentDiscards, playerDiscards, cards, selectedCardId, lockedCardId, canLock, busy, reducedMotion, lastRound, remaining, cardBackLabel, discardLabel, lockLabel, waitingLabel, selectedLabel, cardLabel, selectedLift, onSelect, onLock, opponentLocked = false, presentation, statusLabel, summaryLabel }: {
  readonly roundLabel?: string;
  readonly exitLabel?: string;
  readonly onExit?: () => void;
  readonly lockedHintLabel?: string;
  readonly slotHintLabel?: string;
  readonly extraLabel?: string;
  readonly bannerLabels?: { readonly win: string; readonly loss: string; readonly draw: string };
  readonly opponentLocked?: boolean;
  readonly presentation?: BoardRoundPresentation;
  readonly statusLabel?: string;
  readonly summaryLabel?: string;
  readonly opponentName: string;
  readonly playerName: string;
  readonly scoreLabel: string;
  readonly opponentScore: number;
  readonly playerScore: number;
  readonly opponentCardCount: number;
  readonly opponentDiscards: readonly CardKind[];
  readonly playerDiscards: readonly CardKind[];
  readonly cards: readonly BoardCard[];
  readonly selectedCardId: string | null;
  readonly lockedCardId: string | null;
  readonly canLock: boolean;
  readonly busy: boolean;
  readonly reducedMotion: boolean;
  readonly lastRound: { readonly player: CardKind; readonly opponent: CardKind } | null;
  readonly remaining: number;
  readonly cardBackLabel: string;
  readonly discardLabel: string;
  readonly lockLabel: string;
  readonly waitingLabel: string;
  readonly selectedLabel: string;
  readonly cardLabel: (kind: CardKind) => string;
  readonly selectedLift: number;
  readonly onSelect: (id: string) => void;
  readonly onLock: (id: string) => void;
}) {
  const progress = useSharedValue(0);
  const discardProgress = useSharedValue(0);
  const outcomeProgress = useSharedValue(0);
  const opponentRail = useRef<ViewRef>(null);
  const playerRail = useRef<ViewRef>(null);
  const flipKey = presentation?.cards ? `${presentation.key}` : null;
  useEffect(() => {
    cancelAnimation(progress);
    const initial = presentation?.progress ?? 0;
    progress.set(reducedMotion ? (presentation?.facesVisible ? 1 : 0) : initial);
    if (!reducedMotion && flipKey && initial < 1) progress.set(withTiming(1, { duration: presentation?.flipRemainingMs ?? 0, easing: Easing.linear }));
    return () => cancelAnimation(progress);
    // A duplicate poll must not restart either card's shared flip.
  }, [flipKey, reducedMotion, presentation?.facesVisible]);
  useEffect(() => {
    cancelAnimation(discardProgress);
    discardProgress.set(presentation?.stage === 'discard' ? presentation.discardProgress : 0);
    if (presentation?.stage === 'discard') discardProgress.set(reducedMotion ? 1 : withTiming(1, { duration: presentation.discardRemainingMs, easing: Easing.linear }));
    return () => cancelAnimation(discardProgress);
  }, [discardProgress, presentation?.stage, reducedMotion]);
  useEffect(() => {
    cancelAnimation(outcomeProgress);
    outcomeProgress.set(reducedMotion ? 1 : presentation?.outcomeProgress ?? 0);
    if (!reducedMotion && presentation?.stage === 'outcome') outcomeProgress.set(withTiming(1, { duration: presentation.outcomeRemainingMs, easing: Easing.linear }));
    return () => cancelAnimation(outcomeProgress);
    // Duplicate snapshots keep the same authority timeline instead of replaying feedback.
  }, [outcomeProgress, presentation?.key, presentation?.stage, reducedMotion]);
  const outcome = presentation?.stage === 'outcome' ? presentation.outcome : null;
  const opponentOutcome = outcome === 'WIN' ? 'LOSS' : outcome === 'LOSS' ? 'WIN' : outcome;
  const dropTargetRef = useRef<ViewRef>(null);
  const [dropTarget, setDropTarget] = useState<MeasuredBounds | null>(null);
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [surfaceHeight, setSurfaceHeight] = useState(height);
  const [arenaCenterY, setArenaCenterY] = useState<number | null>(null);
  const availableHeight = surfaceHeight - insets.top - insets.bottom;
  const regularArenaDiameter = Math.min(248, width * .78);
  const compact = availableHeight < styles.opponentZone.minHeight + regularArenaDiameter + styles.playerZone.minHeight || width < 350;
  const arenaDiameter = compact ? 194 : regularArenaDiameter;
  const backdrop = arenaCenterY === null ? undefined : getBoardBackdropLayout(surfaceHeight, insets.top + arenaCenterY);
  const lockedCard = cards.find((card) => card.id === lockedCardId) ?? null;
  const handCards = cards.filter((card) => card.id !== lockedCardId);
  const urgent = canLock && remaining > 0 && remaining <= 5;
  const bannerStyle = useAnimatedStyle(() => {
    const t = outcomeProgress.get();
    return { opacity: reducedMotion ? 1 : Math.min(1, t * 6) * Math.min(1, (1 - t) * 8 + .001), transform: [{ scale: reducedMotion ? 1 : .82 + .18 * Math.min(1, t * 5) + .05 * Math.sin(Math.PI * Math.min(1, t * 3)) }] };
  });
  const bannerText = outcome && bannerLabels ? (outcome === 'WIN' ? bannerLabels.win : outcome === 'LOSS' ? bannerLabels.loss : bannerLabels.draw) : null;
  const canTapSlot = canLock && !busy && selectedCardId !== null && selectedCardId !== lockedCardId;
  const measureDropTarget = () => dropTargetRef.current?.measureInWindow((left, top, width, height) => setDropTarget({ x: left, y: top, width, height }));
  return <FolkSurface background="woven" contentStyle={styles.board} onLayout={(event) => setSurfaceHeight(event.nativeEvent.layout.height)} backgroundImageStyle={backdrop && { ...backdrop, bottom: undefined }}>
    <View style={[styles.opponentZone, compact ? styles.compactOpponent : { minHeight: Math.min(styles.playerZone.minHeight, availableHeight - arenaDiameter - styles.playerZone.minHeight) }]}>
      <View style={styles.boardTopBar}>
        {onExit && exitLabel ? <FolkBackButton cue="ui-tap" label={exitLabel} onPress={onExit} style={styles.exitButton} /> : <View style={styles.exitButton} />}
        <ScorePlaque compact={compact} color="blue" label={opponentName} score={opponentScore} style={[styles.opponentScore, compact && styles.compactScore]} />
        <View style={styles.roundPillColumn}>{roundLabel ? <View testID="board-round-indicator" style={styles.roundPill}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={styles.roundPillText}>{roundLabel}</Text></View> : null}</View>
      </View>
      <View style={styles.opponentTable}>
        <View style={styles.opponentHand}>{Array.from({ length: Math.max(0, opponentCardCount - (opponentLocked ? 1 : 0)) }, (_, index) => <FolkCardBack key={index} label={cardBackLabel} style={[styles.opponentBack, compact && styles.compactBack]} />)}</View>
        <DiscardRail testID="board-opponent-discards" railRef={opponentRail} label={discardLabel} kinds={opponentDiscards} cardLabel={cardLabel} compact={compact} />
      </View>
    </View>
    <View testID="board-arena" accessibilityLabel="VS" onLayout={(event) => setArenaCenterY(event.nativeEvent.layout.y + event.nativeEvent.layout.height / 2)} style={[styles.arena, { height: arenaDiameter, width: arenaDiameter }]}>
      <View testID="board-opponent-slot" style={[styles.dropSlot, compact && styles.compactDropSlot]}>
        {opponentLocked || presentation?.stage === 'prepare' || presentation?.cards ? <RoundSlotCard kind={presentation?.cards?.opponent ?? null} label={presentation?.facesVisible && presentation.cards ? cardLabel(presentation.cards.opponent) : cardBackLabel} backLabel={cardBackLabel} compact={compact} progress={progress} facesVisible={presentation?.facesVisible ?? false} discardProgress={discardProgress} destination={opponentRail} outcome={opponentOutcome} outcomeProgress={outcomeProgress} reducedMotion={reducedMotion} /> : null}
      </View>
      <View style={styles.arenaStatus}><Image source={folkAssets.board.vs} resizeMode="contain" style={[styles.vs, compact && styles.compactVs]} /><Text testID="board-round-status" accessibilityLiveRegion="polite" adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={2} style={styles.roundStatus}>{statusLabel ?? waitingLabel}</Text>
        {bannerText ? <Animated.View testID="board-round-banner" pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.roundBanner, outcome === 'WIN' ? styles.roundBannerWin : outcome === 'LOSS' ? styles.roundBannerLoss : styles.roundBannerDraw, bannerStyle]}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={styles.roundBannerText}>{outcome === 'WIN' ? '✓ ' : outcome === 'LOSS' ? '× ' : '= '}{bannerText}{outcome === 'WIN' ? '  +1' : ''}</Text></Animated.View> : null}
      </View>
      <Pressable ref={dropTargetRef} testID="board-drop-target" accessible accessibilityRole={canTapSlot ? 'button' : undefined} disabled={!canTapSlot} onPress={canTapSlot ? () => onLock(selectedCardId) : undefined} accessibilityLabel={presentation?.facesVisible && presentation.cards ? cardLabel(presentation.cards.player) : lockedCard ? `${selectedLabel}: ${cardLabel(lockedCard.kind)}` : lockLabel} onLayout={measureDropTarget} style={[styles.dropSlot, compact && styles.compactDropSlot, canTapSlot && styles.dropSlotReady]}>
        {presentation?.stage === 'prepare' || presentation?.cards ? <RoundSlotCard kind={presentation.cards?.player ?? null} label={presentation.facesVisible && presentation.cards ? cardLabel(presentation.cards.player) : cardBackLabel} backLabel={cardBackLabel} compact={compact} progress={progress} facesVisible={presentation.facesVisible} discardProgress={discardProgress} destination={playerRail} outcome={outcome} outcomeProgress={outcomeProgress} reducedMotion={reducedMotion} /> : lockedCard ? <View testID="board-locked-card" accessibilityLabel={cardLabel(lockedCard.kind)}><CardFace kind={lockedCard.kind} label={cardLabel(lockedCard.kind)} style={[styles.slotCard, compact && styles.compactSlotCard]} /></View> : !presentation && !canLock && lastRound ? <CardFace kind={lastRound.player} label={cardLabel(lastRound.player)} compact={compact} /> : canTapSlot && slotHintLabel ? <Text testID="board-slot-hint" numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.8} style={styles.slotHint}>{slotHintLabel}</Text> : null}
      </Pressable>
    </View>
    <View style={[styles.playerZone, compact && styles.compactPlayer]}>
      <View style={[styles.playerHeader, compact && styles.compactPlayerHeader]}><View style={styles.playerDiscards}><DiscardRail testID="board-player-discards" railRef={playerRail} label={discardLabel} kinds={playerDiscards} cardLabel={cardLabel} compact={compact} /></View><View testID="board-player-score-column" style={styles.headerColumn}><ScorePlaque compact={compact} color="red" label={playerName} score={playerScore} style={[styles.playerScore, compact && styles.compactScore]} /></View><View style={styles.headerColumn}><View style={[styles.boardTimer, compact && styles.compactBoardTimer]}>{canLock ? <ImageBackground testID="board-selection-timer" source={folkAssets.board.timerBadge} resizeMode="contain" style={[styles.boardTimer, compact && styles.compactBoardTimer, urgent && remaining % 2 === 1 && styles.timerUrgent]}><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.timerText, styles.boardTimerText, urgent && styles.timerUrgentText]}>{remaining}s</Text></ImageBackground> : null}</View></View></View>
      <View style={[styles.hand, compact && styles.compactHand]}>
        {handCards.map((card, index) => <View key={card.id} style={[styles.handCard, compact && styles.compactHandCard, index > 0 && !compact && styles.handOverlap, { transform: [{ rotate: `${(index - (handCards.length - 1) / 2) * 4}deg` }] }]}><DraggableBoardCard card={card} compact={compact} selected={selectedCardId === card.id} canDrag={canLock && !busy} reducedMotion={reducedMotion} selectedLift={selectedLift} target={dropTarget} lockLabel={lockLabel} label={cardLabel(card.kind)} badge={card.extra ? extraLabel : undefined} onSelect={onSelect} onLock={onLock} /></View>)}
      </View>
      <Text style={styles.boardStatus}>{summaryLabel ?? (presentation?.stage === 'prepare' && lockedCard ? `${selectedLabel}: ${cardLabel(lockedCard.kind)}` : presentation?.stage === 'outcome' && presentation.outcome === 'WIN' ? '+1' : presentation?.stage === 'outcome' && presentation.outcome === 'LOSS' ? `${opponentName} +1` : lockedCard ? (lockedHintLabel ?? selectedLabel) : scoreLabel)}</Text>
    </View>
  </FolkSurface>;
}

export function FolkResultView({ columnLabels, hint, roundMarks, title, outcome, scoreLabel, playerScore, opponentScore, roundLabel, history, cardLabel, primaryLabel, secondaryLabel, primaryDisabled, onPrimary, onSecondary, celebrateWin = false }: {
  readonly columnLabels?: { readonly player: string; readonly opponent: string };
  readonly hint?: string;
  readonly roundMarks?: { readonly win: string; readonly loss: string; readonly draw: string };
  readonly title: string;
  readonly outcome: string;
  readonly scoreLabel: string;
  readonly playerScore: number;
  readonly opponentScore: number;
  readonly roundLabel: string;
  readonly history: readonly RoundHistoryRow[];
  readonly cardLabel: (kind: CardKind) => string;
  readonly primaryLabel: string;
  readonly secondaryLabel: string;
  readonly primaryDisabled?: boolean;
  readonly onPrimary: () => void;
  readonly onSecondary: () => void;
  readonly celebrateWin?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const entrance = useSharedValue(1);
  const petals = useSharedValue(0);
  const celebrated = useRef(false);
  const [showPetals, setShowPetals] = useState(false);
  useEffect(() => {
    entrance.set(reducedMotion ? 1 : 0);
    if (!reducedMotion) entrance.set(withTiming(1, { duration: 300 }));
    const lifecycle = AppState.addEventListener('change', (state) => { if (state !== 'active') { cancelAnimation(entrance); entrance.set(1); cancelAnimation(petals); setShowPetals(false); } });
    return () => { lifecycle.remove(); cancelAnimation(entrance); };
  }, [entrance, petals, reducedMotion]);
  useEffect(() => {
    cancelAnimation(petals); setShowPetals(false);
    if (!celebrateWin || celebrated.current) return;
    celebrated.current = true;
    if (reducedMotion) return;
    setShowPetals(true); petals.set(0); petals.set(withTiming(1, { duration: 900 }));
    const timer = setTimeout(() => setShowPetals(false), 900);
    return () => { clearTimeout(timer); cancelAnimation(petals); };
  }, [celebrateWin, petals, reducedMotion]);
  const entranceStyle = useAnimatedStyle(() => ({ opacity: reducedMotion ? 1 : .7 + entrance.get() * .3, transform: [{ scale: reducedMotion ? 1 : .95 + entrance.get() * .05 }] }));
  return <FolkSurface background="village"><ScrollView contentContainerStyle={styles.resultContent}>
    <FolkTitle style={styles.resultTitle}>{title}</FolkTitle>
    <Animated.View style={[styles.outcomeStamp, entranceStyle]}><Text adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={2} style={styles.outcomeText}>{outcome}</Text>{showPetals && !reducedMotion ? <View testID="match-win-petals" pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>{petalDirections.map((direction, index) => <WinPetal key={index} direction={direction} compact={false} progress={petals} />)}</View> : null}</Animated.View>
    <ImageBackground testID="result-score" source={folkAssets.controls.redButton} resizeMode="stretch" imageStyle={styles.fillImage} style={styles.resultScore}><View style={styles.resultScoreContent}><Text adjustsFontSizeToFit numberOfLines={1} style={styles.resultScoreLabel}>{scoreLabel}</Text><Text adjustsFontSizeToFit numberOfLines={1} style={styles.resultScoreValue}>{playerScore} – {opponentScore}</Text></View></ImageBackground>
    {history.length === 0 ? null : <ImageBackground source={folkAssets.board.scrollPanel} resizeMode="stretch" imageStyle={styles.fillImage} style={styles.historyPanel}>
      <View style={styles.historyContent}>
      {columnLabels ? <View testID="result-history-header" style={styles.historyHeader}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[styles.historyHeaderText, styles.historyHeaderPlayer]}>{columnLabels.player}</Text><View style={styles.roundCopy} /><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[styles.historyHeaderText, styles.historyHeaderOpponent]}>{columnLabels.opponent}</Text></View> : null}
      {history.map((row) => {
        const result = resolveRound(row.local, row.opponent);
        const mark = result === 'WIN' ? '✓' : result === 'LOSS' ? '×' : '=';
        const markLabel = roundMarks ? (result === 'WIN' ? roundMarks.win : result === 'LOSS' ? roundMarks.loss : roundMarks.draw) : mark;
        return <View key={row.round} style={styles.historyRow}><CardFace kind={row.local} label={cardLabel(row.local)} small style={[styles.historyCard, result === 'WIN' && styles.historyWinner, result === 'LOSS' && styles.historyLoser]} /><View testID={`result-round-copy-${row.round}`} accessible accessibilityLabel={`${roundLabel} ${row.round}: ${markLabel}`} style={styles.roundCopy}><Text style={styles.roundLabel}>{roundLabel} {row.round}</Text><Text testID={`result-round-mark-${row.round}`} style={[styles.historyVs, result === 'WIN' && styles.markWin, result === 'LOSS' && styles.markLoss]}>{mark}</Text></View><CardFace kind={row.opponent} label={cardLabel(row.opponent)} small style={[styles.historyCard, result === 'LOSS' && styles.historyWinner, result === 'WIN' && styles.historyLoser]} /></View>;
      })}
      </View>
    </ImageBackground>}
    {hint ? <Text testID="result-hint" style={styles.resultHint}>{hint}</Text> : null}
    <View style={styles.resultActions}><FolkButton cue={null} accessibilityLabel={primaryLabel} disabled={primaryDisabled} onPress={onPrimary} style={styles.resultButton}>{primaryLabel}</FolkButton><FolkButton cue={null} variant="blue" accessibilityLabel={secondaryLabel} onPress={onSecondary} style={styles.resultButton}>{secondaryLabel}</FolkButton></View>
  </ScrollView></FolkSurface>;
}

export function FolkResultLoadingView({ label }: { readonly label: string }) {
  return <FolkSurface background="village" contentStyle={styles.resultLoading}><FolkTitle>{label}</FolkTitle></FolkSurface>;
}

export function FolkReconnectingView({ title, body, remaining, statusStyle, leaveLabel, onLeave }: { readonly title: string; readonly body: string; readonly remaining: number; readonly statusStyle?: ComponentProps<typeof Animated.View>['style']; readonly leaveLabel?: string; readonly onLeave?: () => void }) {
  return <FolkSurface background="woven" contentStyle={styles.reconnectBoard}>
    <View testID="reconnect-backdrop" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.reconnectBackdrop}>
      <ScorePlaque color="blue" label="VS" score="–" style={styles.reconnectTopScore} />
      <View style={styles.reconnectBacks}>{[0, 1, 2].map((item) => <FolkCardBack key={item} style={styles.opponentBack} />)}</View>
      <View style={styles.reconnectArena}><View style={styles.emptySlot} /><Image source={folkAssets.board.vs} resizeMode="contain" style={styles.vs} /><View style={styles.emptySlot} /></View>
    </View>
    <View style={styles.dim} />
    <Animated.View testID="reconnect-status" accessible accessibilityRole="alert" accessibilityLabel={`${title}. ${body} ${remaining}s`} accessibilityLiveRegion="polite" style={[styles.reconnectModal, statusStyle]}><Image source={folkAssets.decorations.drum} resizeMode="contain" style={styles.reconnectDrum} /><ImageBackground source={folkAssets.board.scrollPanel} resizeMode="stretch" imageStyle={styles.fillImage} style={styles.reconnectScroll}><View style={styles.reconnectContent}><Text accessibilityRole="header" adjustsFontSizeToFit minimumFontScale={0.8} numberOfLines={1} style={styles.reconnectTitle}>{title}</Text><Text style={styles.reconnectBody}>{body}</Text><Text style={styles.reconnectCountdown}>{remaining}s</Text></View></ImageBackground></Animated.View>
    {leaveLabel && onLeave ? <View style={styles.reconnectLeave}><FolkButton variant="blue" cue="paper-slide" accessibilityLabel={leaveLabel} onPress={onLeave}>{leaveLabel}</FolkButton></View> : null}
  </FolkSurface>;
}

const styles = StyleSheet.create({
  scorePlaque: { alignItems: 'center', height: 94, justifyContent: 'center', paddingHorizontal: 18, width: 94 },
  scoreLabel: { color: '#FFF0C6', fontSize: 12, fontWeight: '900', maxWidth: 62, textAlign: 'center', textShadowColor: '#43291F', textShadowOffset: { height: 1, width: 1 }, textShadowRadius: 1 },
  scoreValue: { color: '#FFF0C6', fontSize: 25, fontWeight: '900', lineHeight: 27 },
  fullWidth: { width: '100%' },
  fillImage: { height: '100%', width: '100%' },
  cardFace: { alignItems: 'center', backgroundColor: '#F7E6B0', borderRadius: 8, height: 108, justifyContent: 'center', overflow: 'hidden', width: 72 },
  cardFaceSmall: { borderRadius: 5, height: 63, width: 42 },
  cardFrame: { bottom: 0, height: '100%', left: 0, position: 'absolute', width: '100%' },
  cardArt: { height: '62%', width: '80%' },
  draftSurface: { flex: 1 },
  draftContent: { alignItems: 'center', flexGrow: 1, justifyContent: 'center', gap: 16, paddingHorizontal: 16, paddingVertical: 24 },
  compactDraftContent: { gap: 8, paddingVertical: 12 },
  compactDraftTitle: { height: 64 },
  compactOpponentPanel: { minHeight: 84, paddingHorizontal: 32, paddingVertical: 12 },
  compactAvatar: { height: 48, width: 48 },
  compactInstruction: { minHeight: 90, paddingVertical: 20 },
  draftTitle: { height: 76, marginTop: 2 },
  opponentPanel: { maxWidth: 340, width: '100%' },
  opponentPanelContent: { alignItems: 'center', flexDirection: 'row', minHeight: 116, justifyContent: 'center', paddingHorizontal: 36, paddingVertical: 20 },
  opponentAvatar: { height: 84, width: 84 },
  opponentCopy: { flex: 1, marginLeft: 8, maxWidth: 160 },
  opponentName: { color: '#8A241A', fontSize: 18, fontWeight: '900', textAlign: 'center' },
  draftStatus: { color: '#8A241A', fontSize: 17, fontWeight: '900', textAlign: 'center' },
  draftRevealWrap: { alignItems: 'center', justifyContent: 'center' },
  draftRevealFace: { height: '82%', width: '86%' },
  draftRevealText: { color: '#8A241A', fontSize: 13, fontWeight: '900', marginTop: 2 },
  timerUrgent: { transform: [{ scale: 1.14 }] },
  timerUrgentText: { color: '#FFD23F' },
  draftCards: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'center' },
  draftChoice: { alignItems: 'center', borderColor: 'transparent', borderRadius: 12, borderWidth: 3, justifyContent: 'center' },
  draftUnavailable: { opacity: 0.55 },
  draftSelected: { backgroundColor: 'rgba(240,207,131,0.25)', borderColor: '#F0CF83', transform: [{ translateY: -6 }] },
  draftCardBack: { height: '100%', width: '100%' },
  positionLabel: { backgroundColor: '#8A241A', borderRadius: 11, bottom: 2, color: '#FFF0C6', fontSize: 12, fontWeight: '900', height: 22, lineHeight: 22, position: 'absolute', textAlign: 'center', width: 22 },
  instructionScroll: { maxWidth: 340, width: '100%' },
  instructionContent: { alignItems: 'center', minHeight: 110, justifyContent: 'center', paddingHorizontal: '18%', paddingVertical: 28 },
  instructionText: { color: '#5A3521', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  draftTimer: { alignItems: 'center', height: 58, justifyContent: 'center', width: 58 },
  timerText: { color: '#FFF0C6', fontSize: 15, fontWeight: '900', textShadowColor: '#43291F', textShadowOffset: { height: 1, width: 1 }, textShadowRadius: 1 },
  board: { flex: 1, justifyContent: 'center' },
  opponentZone: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 150, paddingHorizontal: 8 },
  opponentScore: { zIndex: 1 },
  boardTopBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: -6, maxWidth: 360, width: '100%' },
  exitButton: { alignItems: 'flex-start', height: 48, width: 84 },
  roundPillColumn: { alignItems: 'flex-end', width: 84 },
  roundPill: { backgroundColor: '#8A241A', borderColor: '#E3B64B', borderRadius: 14, borderWidth: 2, minWidth: 76, paddingHorizontal: 10, paddingVertical: 4 },
  roundPillText: { color: '#FFF0C6', fontSize: 14, fontWeight: '900', textAlign: 'center' },
  opponentTable: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', maxWidth: 360, minHeight: 78, paddingHorizontal: 8, width: '100%' },
  opponentHand: { flex: 1, flexDirection: 'row', gap: 3, justifyContent: 'center' },
  opponentBack: { height: 66, width: 44 },
  discardRail: { alignItems: 'center', backgroundColor: 'rgba(247,230,176,0.86)', borderColor: 'rgba(140,90,44,0.55)', borderRadius: 8, borderWidth: 1, paddingBottom: 3, paddingHorizontal: 3, paddingTop: 1 },
  discardCards: { flexDirection: 'row', gap: 2 },
  discardLabel: { color: '#5A3521', fontSize: 11, fontWeight: '900', maxWidth: 110, textAlign: 'center' },
  discardSlot: { borderRadius: 4, height: 39, width: 26 },
  compactDiscardSlot: { height: 33, width: 22 },
  discardEmpty: { backgroundColor: 'rgba(111,69,44,0.08)', borderColor: 'rgba(111,69,44,0.45)', borderStyle: 'dashed', borderWidth: 1 },
  arena: { alignItems: 'center', alignSelf: 'center', aspectRatio: 1, backgroundColor: 'rgba(247,230,176,0.62)', borderColor: '#C89949', borderRadius: 180, borderWidth: 2, flexDirection: 'column', justifyContent: 'center' },
  emptySlot: { borderColor: 'rgba(111,69,44,0.52)', borderRadius: 8, borderStyle: 'dashed', borderWidth: 2, height: 96, width: 64 },
  slotCard: { height: 96, width: 64 },
  compactSlotCard: { height: 70, width: 46 },
  slotFill: { height: '100%', width: '100%' },
  winnerCard: { position: 'absolute', top: -2, right: -2, bottom: -2, left: -2, borderColor: '#E3B64B', borderWidth: 3, borderRadius: 8 },
  winPetal: { position: 'absolute', top: '50%', left: '50%', marginLeft: -4, marginTop: -7, width: 9, height: 14, backgroundColor: '#F5A7B9', borderColor: '#E3B64B', borderWidth: 1, borderTopLeftRadius: 9, borderTopRightRadius: 9, borderBottomRightRadius: 9, borderBottomLeftRadius: 1 },
  arenaStatus: { alignItems: 'center', flexDirection: 'row', height: 48, width: '95%' },
  roundStatus: { flex: 1, color: '#5A3521', fontSize: 14, fontWeight: '900', textAlign: 'center' },
  roundBanner: { alignItems: 'center', borderRadius: 14, borderWidth: 2, bottom: 0, justifyContent: 'center', left: -6, paddingHorizontal: 10, position: 'absolute', right: -6, top: 0 },
  roundBannerWin: { backgroundColor: '#8A241A', borderColor: '#F0CF83' },
  roundBannerLoss: { backgroundColor: '#24486B', borderColor: '#C7D3DE' },
  roundBannerDraw: { backgroundColor: '#6F452C', borderColor: '#F0CF83' },
  roundBannerText: { color: '#FFF0C6', fontSize: 22, fontWeight: '900', textAlign: 'center', textShadowColor: '#43291F', textShadowOffset: { height: 1, width: 1 }, textShadowRadius: 2 },
  dropSlotReady: { backgroundColor: 'rgba(240,207,131,0.5)', borderColor: '#8A241A', borderStyle: 'solid' },
  slotHint: { color: '#8A241A', fontSize: 11, fontWeight: '900', paddingHorizontal: 2, textAlign: 'center' },
  dropSlot: { alignItems: 'center', borderColor: 'rgba(111,69,44,0.52)', borderRadius: 8, borderStyle: 'dashed', borderWidth: 2, height: 96, justifyContent: 'center', width: 64 },
  vs: { height: 56, marginVertical: 1, width: 56 },
  playerZone: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 256, paddingBottom: 3, paddingHorizontal: 8 },
  playerHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', maxWidth: 340, minHeight: 70, width: '100%' },
  playerScore: { alignSelf: 'center' },
  headerColumn: { alignItems: 'center', width: '32%' },
  playerDiscards: { alignItems: 'flex-start', width: '36%' },
  hand: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'center', minHeight: 118 },
  handCard: { width: 92 },
  handOverlap: { marginLeft: -20 },
  compactOpponent: { minHeight: 128 },
  compactPlayer: { minHeight: 174 },
  compactPlayerHeader: { minHeight: 52 },
  compactScore: { height: 52, paddingHorizontal: 4, width: 70 },
  compactScoreLabel: { fontSize: 9, maxWidth: 32 },
  compactScoreValue: { fontSize: 16, lineHeight: 18, maxWidth: 32 },
  boardTimerText: { maxWidth: '65%' },
  compactBoardTimer: { height: 48, width: 48 },
  compactBack: { height: 45, width: 30 },
  compactFace: { height: 88, width: 58 },
  compactFaceSmall: { height: 48, width: 32 },
  compactEmptySlot: { height: 60, width: 42 },
  compactDropSlot: { height: 70, width: 46 },
  compactVs: { height: 40, width: 40 },
  compactHand: { minHeight: 98 },
  compactCard: { height: 90, width: 63 },
  compactHandCard: { width: 63 },
  boardStatus: { color: '#FFF0C6', fontSize: 14, fontWeight: '800', minHeight: 20, textAlign: 'center', textShadowColor: '#43291F', textShadowOffset: { height: 1, width: 1 }, textShadowRadius: 1 },
  boardTimer: { alignItems: 'center', height: 58, justifyContent: 'center', width: 58 },
  resultContent: { alignItems: 'center', flexGrow: 1, justifyContent: 'center', paddingVertical: 6, paddingHorizontal: 16 },
  resultTitle: { height: 56 },
  outcomeStamp: { alignItems: 'center', backgroundColor: 'rgba(247,230,176,0.92)', borderColor: '#8A241A', borderRadius: 47, borderWidth: 6, height: 94, justifyContent: 'center', marginTop: -6, transform: [{ rotate: '-4deg' }], width: 94 },
  outcomeText: { color: '#8A241A', fontSize: 23, fontWeight: '900', padding: 10, textAlign: 'center' },
  resultScore: { marginTop: 4, maxWidth: '100%', overflow: 'hidden', width: 300 },
  resultScoreContent: { alignItems: 'center', flexDirection: 'row', gap: 14, minHeight: 52, justifyContent: 'center', paddingHorizontal: 48 },
  resultScoreLabel: { color: '#FFF0C6', fontSize: 14, fontWeight: '900', textShadowColor: '#43291F', textShadowOffset: { height: 1, width: 1 }, textShadowRadius: 1 },
  resultScoreValue: { color: '#FFF0C6', fontSize: 24, fontWeight: '900', textShadowColor: '#43291F', textShadowOffset: { height: 1, width: 1 }, textShadowRadius: 1 },
  historyPanel: { marginTop: -3, maxWidth: '100%', width: 320 },
  historyContent: { justifyContent: 'center', paddingBottom: 50, paddingHorizontal: 44, paddingTop: 64 },
  historyHeader: { alignItems: 'center', flexDirection: 'row', gap: 16, justifyContent: 'center', minHeight: 20 },
  historyHeaderText: { fontSize: 12, fontWeight: '900', textAlign: 'center', width: 52 },
  historyHeaderPlayer: { color: '#8A241A' },
  historyHeaderOpponent: { color: '#24486B' },
  historyRow: { alignItems: 'center', borderBottomColor: 'rgba(117,88,70,0.22)', borderBottomWidth: 1, flexDirection: 'row', gap: 16, justifyContent: 'center', minHeight: 47 },
  historyCard: { borderColor: 'transparent', borderWidth: 2, height: 42, marginHorizontal: 10, width: 28 },
  historyWinner: { borderColor: '#D6A73A' },
  historyLoser: { opacity: 0.5 },
  markWin: { color: '#3F6B35' },
  markLoss: { color: '#A63D2F' },
  resultHint: { backgroundColor: 'rgba(247,230,176,0.9)', borderRadius: 10, color: '#5A3521', fontSize: 14, fontWeight: '800', marginTop: 4, maxWidth: 320, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 6, textAlign: 'center' },
  roundCopy: { alignItems: 'center', width: 72 },
  roundLabel: { color: '#5A3521', fontSize: 13, fontWeight: '900', textAlign: 'center' },
  historyVs: { color: '#6F452C', fontSize: 18, fontWeight: '900', lineHeight: 20 },
  resultActions: { gap: 6, marginTop: 4, maxWidth: 340, width: '100%' },
  resultButton: { minHeight: 54 },
  resultLoading: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  reconnectBoard: { flex: 1 },
  reconnectBackdrop: { flex: 1 },
  reconnectTopScore: { left: 8, position: 'absolute', top: 4 },
  reconnectBacks: { alignSelf: 'center', flexDirection: 'row', gap: 4, marginTop: 62 },
  reconnectArena: { alignItems: 'center', alignSelf: 'center', flexDirection: 'row', marginTop: 56 },
  dim: { backgroundColor: 'rgba(24,14,10,0.72)', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  reconnectModal: { alignItems: 'center', bottom: 0, justifyContent: 'center', left: 18, position: 'absolute', right: 18, top: 0 },
  reconnectLeave: { alignSelf: 'center', bottom: 20, maxWidth: 300, position: 'absolute', width: '80%' },
  reconnectDrum: { height: 132, marginBottom: -40, width: 132, zIndex: 1 },
  reconnectScroll: { alignItems: 'center', minHeight: 178, justifyContent: 'center', maxWidth: '100%', width: 320 },
  reconnectContent: { alignItems: 'center', paddingHorizontal: 48, paddingVertical: 48, width: '100%' },
  reconnectTitle: { alignSelf: 'stretch', color: '#8A241A', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  reconnectBody: { alignSelf: 'stretch', color: '#5A3521', fontSize: 13, marginTop: 4, textAlign: 'center' },
  reconnectCountdown: { color: '#8A241A', fontSize: 27, fontWeight: '900', marginTop: 4 },
});
