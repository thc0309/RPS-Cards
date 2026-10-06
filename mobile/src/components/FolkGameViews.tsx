import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import type { CardKind } from '@rps-cards/game-core';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, type SharedValue, Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { FolkButton } from './FolkButton';
import { FolkCard, FolkCardBack } from './FolkCard';
import { FolkSurface } from './FolkSurface';
import { FolkTitle } from './FolkChrome';
import { folkAssets } from '../ui/folk-assets';
import type { BoardRoundPresentation } from '../game/board-round-presentation';
import type { RoundHistoryRow } from '../ui/round-history';

const cardArt = { ROCK: folkAssets.cards.rock, PAPER: folkAssets.cards.paper, SCISSORS: folkAssets.cards.scissors } as const;

function ScorePlaque({ score, label, color, style }: { readonly score: number | string; readonly label: string; readonly color: 'red' | 'blue'; readonly style?: object }) {
  return <ImageBackground source={color === 'red' ? folkAssets.board.scoreRed : folkAssets.board.scoreBlue} resizeMode="contain" style={[styles.scorePlaque, style]}><Text numberOfLines={1} adjustsFontSizeToFit style={styles.scoreLabel}>{label}</Text><Text style={styles.scoreValue}>{score}</Text></ImageBackground>;
}

function CardFace({ kind, label, small = false, compact = false, style }: { readonly kind: CardKind; readonly label: string; readonly small?: boolean; readonly compact?: boolean; readonly style?: StyleProp<ViewStyle> }) {
  return <View accessibilityLabel={label} style={[styles.cardFace, small && styles.cardFaceSmall, compact && (small ? styles.compactFaceSmall : styles.compactFace), style]}><Image source={folkAssets.cards.frame} resizeMode="stretch" style={styles.cardFrame} /><Image source={cardArt[kind]} resizeMode="contain" style={styles.cardArt} /></View>;
}

export function FolkDraftView({ title, status, instruction, timer, cardBackLabel, unavailableLabel, positions, selectedPosition, disabled, onPick }: {
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
  const { width, height } = useWindowDimensions();
  const compact = height < 650;
  const cardWidth = Math.min(110, (width - 48) / 3);
  const timerBadge = <ImageBackground source={folkAssets.board.timerBadge} resizeMode="contain" style={styles.draftTimer}><Text style={styles.timerText}>{timer}s</Text></ImageBackground>;
  return <FolkSurface background="woven" contentStyle={styles.draftSurface}>
    <ScrollView style={styles.fullWidth} contentContainerStyle={[styles.draftContent, compact && styles.compactDraftContent]}>
    <FolkTitle style={[styles.draftTitle, compact && styles.compactDraftTitle]}>{title}</FolkTitle>
    <ImageBackground source={folkAssets.controls.paperPanel} resizeMode="stretch" imageStyle={styles.fillImage} style={styles.opponentPanel}>
      <View style={[styles.opponentPanelContent, compact && styles.compactOpponentPanel]}>
      <Image source={folkAssets.decorations.lion} resizeMode="contain" style={[styles.opponentAvatar, compact && styles.compactAvatar]} />
      <View style={styles.opponentCopy}><Text style={styles.opponentName}>VS</Text><Text accessibilityLiveRegion="polite" style={styles.draftStatus}>{status}</Text></View>
      {compact ? timerBadge : null}
      </View>
    </ImageBackground>
    <View style={styles.draftCards}>
      {[0, 1, 2].map((position) => {
        const available = availablePositions.has(position);
        const slotDisabled = disabled || !available;
        return <Pressable key={position} testID={`draft-slot-${position}`} accessibilityRole="button" accessibilityLabel={`${cardBackLabel} ${position + 1}${available ? '' : `, ${unavailableLabel}`}`} accessibilityState={{ disabled: slotDisabled, selected: selectedPosition === position }} disabled={slotDisabled} onPress={available ? () => onPick(position) : undefined} style={[styles.draftChoice, { width: cardWidth, height: cardWidth * 1.5 + 12 }, !available && styles.draftUnavailable, selectedPosition === position && styles.draftSelected]}>
        <FolkCardBack label={cardBackLabel} style={styles.draftCardBack} />
        <Text style={styles.positionLabel}>{available ? position + 1 : '×'}</Text>
        </Pressable>;
      })}
    </View>
    <ImageBackground source={folkAssets.board.scrollPanel} resizeMode="stretch" imageStyle={styles.fillImage} style={styles.instructionScroll}>
      <View style={[styles.instructionContent, compact && styles.compactInstruction]}><Text style={styles.instructionText}>{instruction}</Text></View>
    </ImageBackground>
    {compact ? null : timerBadge}
    </ScrollView>
  </FolkSurface>;
}

export type BoardCard = { readonly id: string; readonly kind: CardKind };

type MeasuredBounds = { readonly x: number; readonly y: number; readonly width: number; readonly height: number };

export function isCardCenterInsideDropTarget(card: MeasuredBounds, target: MeasuredBounds, translateX: number, translateY: number): boolean {
  'worklet';
  const centerX = card.x + card.width / 2 + translateX;
  const centerY = card.y + card.height / 2 + translateY;
  return centerX >= target.x && centerX <= target.x + target.width && centerY >= target.y && centerY <= target.y + target.height;
}

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

function DraggableBoardCard({ card, selected, canDrag, reducedMotion, selectedLift, target, lockLabel, label, compact, onSelect, onLock }: {
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
  const cardRef = useRef<View>(null);
  const [cardBounds, setCardBounds] = useState<MeasuredBounds | null>(null);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const committed = useSharedValue(false);

  useEffect(() => {
    const next = selected ? selectedLift : 0;
    y.set(reducedMotion ? next : withTiming(next, { duration: 150, easing: EASE_OUT }));
    if (!selected) x.set(reducedMotion ? 0 : withTiming(0, { duration: 150, easing: EASE_OUT }));
  }, [reducedMotion, selected, selectedLift, x, y]);

  const pan = useMemo(() => Gesture.Pan()
    .enabled(selected && canDrag && cardBounds !== null && target !== null)
    .onBegin(() => {
      committed.set(false);
      startX.set(x.get());
      startY.set(y.get());
    })
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
    }), [canDrag, card.id, cardBounds, committed, onLock, reducedMotion, selected, selectedLift, startX, startY, target, x, y]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }, { translateY: y.get() }] }));
  const measureCard = () => cardRef.current?.measureInWindow((left, top, width, height) => setCardBounds({ x: left, y: top, width, height }));

  return <View ref={cardRef} onLayout={measureCard}>
    <GestureDetector gesture={pan}>
      <Animated.View testID={`board-hand-card-${card.id}`} style={animatedStyle}>
        <FolkCard kind={card.kind} label={label} style={compact ? styles.compactCard : undefined} selected={selected} disabled={!canDrag} accessibilityActions={selected && canDrag ? [{ name: 'lock', label: lockLabel }] : undefined} onAccessibilityAction={selected && canDrag ? (event) => { if (event.nativeEvent.actionName === 'lock') onLock(card.id); } : undefined} onPress={() => { measureCard(); onSelect(card.id); }} />
      </Animated.View>
    </GestureDetector>
  </View>;
}

function RoundSlotCard({ kind, label, backLabel, compact, progress, facesVisible, discardProgress, destination, winner }: { readonly kind: CardKind | null; readonly label: string; readonly backLabel: string; readonly compact: boolean; readonly progress: SharedValue<number>; readonly facesVisible: boolean; readonly discardProgress: SharedValue<number>; readonly destination: React.RefObject<View | null>; readonly winner: boolean }) {
  const ref = useRef<View>(null);
  const delta = useSharedValue({ x: 0, y: 0 });
  const measure = () => ref.current?.measureInWindow((x, y, width, height) => destination.current?.measureInWindow((dx, dy, dw, dh) => delta.set({ x: dx + dw / 2 - x - width / 2, y: dy + dh / 2 - y - height / 2 })));
  const back = useAnimatedStyle(() => ({ opacity: progress.get() < .5 ? 1 : 0, transform: [{ perspective: 800 }, { rotateY: `${progress.get() * 180}deg` }] }));
  const front = useAnimatedStyle(() => ({ opacity: progress.get() >= .5 ? 1 : 0, transform: [{ perspective: 800 }, { rotateY: `${(progress.get() - 1) * 180}deg` }] }));
  const travel = useAnimatedStyle(() => ({ opacity: 1 - discardProgress.get(), transform: [{ translateX: delta.get().x * discardProgress.get() }, { translateY: delta.get().y * discardProgress.get() }, { scale: 1 - discardProgress.get() * .5 }] }));
  return <Animated.View ref={ref} onLayout={measure} style={[styles.slotCard, compact && styles.compactSlotCard, winner && styles.winnerCard, travel]}>
    <Animated.View accessibilityElementsHidden={facesVisible} importantForAccessibility={facesVisible ? 'no-hide-descendants' : 'auto'} style={[StyleSheet.absoluteFill, back]}><FolkCardBack label={backLabel} style={styles.slotFill} /></Animated.View>
    {kind ? <Animated.View accessibilityElementsHidden={!facesVisible} importantForAccessibility={facesVisible ? 'auto' : 'no-hide-descendants'} style={[StyleSheet.absoluteFill, front]}><CardFace kind={kind} label={label} style={styles.slotFill} /></Animated.View> : null}
  </Animated.View>;
}

export function FolkBoardView({ opponentName, playerName, scoreLabel, opponentScore, playerScore, opponentCardCount, opponentDiscards, playerDiscards, cards, selectedCardId, lockedCardId, canLock, busy, reducedMotion, lastRound, remaining, cardBackLabel, discardLabel, lockLabel, waitingLabel, selectedLabel, cardLabel, selectedLift, onSelect, onLock, opponentLocked = false, presentation, statusLabel, summaryLabel }: {
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
  const opponentRail = useRef<View>(null);
  const playerRail = useRef<View>(null);
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
  const dropTargetRef = useRef<View>(null);
  const [dropTarget, setDropTarget] = useState<MeasuredBounds | null>(null);
  const { height } = useWindowDimensions();
  const compact = height < 650;
  const lockedCard = cards.find((card) => card.id === lockedCardId) ?? null;
  const handCards = cards.filter((card) => card.id !== lockedCardId);
  const measureDropTarget = () => dropTargetRef.current?.measureInWindow((left, top, width, height) => setDropTarget({ x: left, y: top, width, height }));
  return <FolkSurface background="woven" contentStyle={styles.board}>
    <View style={[styles.opponentZone, compact && styles.compactOpponent]}>
      <ScorePlaque color="blue" label={opponentName} score={opponentScore} style={[styles.opponentScore, compact && styles.compactScore]} />
      <View style={styles.opponentTable}>
        <View style={styles.opponentHand}>{Array.from({ length: Math.max(0, opponentCardCount - (opponentLocked ? 1 : 0)) }, (_, index) => <FolkCardBack key={index} label={cardBackLabel} style={[styles.opponentBack, compact && styles.compactBack]} />)}</View>
        <View ref={opponentRail} style={styles.discardRail}><Text numberOfLines={1} style={styles.discardLabel}>{discardLabel}</Text><View style={styles.discardCards}>{opponentDiscards.map((kind, index) => <CardFace key={`${kind}-${index}`} kind={kind} label={cardLabel(kind)} small compact={compact} style={index > 0 ? { marginLeft: compact ? -15 : -22 } : undefined} />)}</View></View>
      </View>
    </View>
    <View testID="board-arena" accessibilityLabel="VS" style={[styles.arena, compact && styles.compactArena]}>
      <View testID="board-opponent-slot" style={[styles.dropSlot, compact && styles.compactDropSlot]}>
        {opponentLocked || presentation?.stage === 'prepare' || presentation?.cards ? <RoundSlotCard kind={presentation?.cards?.opponent ?? null} label={presentation?.facesVisible && presentation.cards ? cardLabel(presentation.cards.opponent) : cardBackLabel} backLabel={cardBackLabel} compact={compact} progress={progress} facesVisible={presentation?.facesVisible ?? false} discardProgress={discardProgress} destination={opponentRail} winner={presentation?.stage === 'outcome' && presentation.outcome === 'LOSS'} /> : null}
      </View>
      <View style={styles.arenaStatus}><Image source={folkAssets.board.vs} resizeMode="contain" style={[styles.vs, compact && styles.compactVs]} /><Text testID="board-round-status" accessibilityLiveRegion="polite" adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={2} style={styles.roundStatus}>{statusLabel ?? waitingLabel}</Text></View>
      <View ref={dropTargetRef} testID="board-drop-target" accessible accessibilityLabel={presentation?.facesVisible && presentation.cards ? cardLabel(presentation.cards.player) : lockedCard ? `${selectedLabel}: ${cardLabel(lockedCard.kind)}` : lockLabel} onLayout={measureDropTarget} style={[styles.dropSlot, compact && styles.compactDropSlot]}>
        {presentation?.stage === 'prepare' || presentation?.cards ? <RoundSlotCard kind={presentation.cards?.player ?? null} label={presentation.facesVisible && presentation.cards ? cardLabel(presentation.cards.player) : cardBackLabel} backLabel={cardBackLabel} compact={compact} progress={progress} facesVisible={presentation.facesVisible} discardProgress={discardProgress} destination={playerRail} winner={presentation.stage === 'outcome' && presentation.outcome === 'WIN'} /> : lockedCard ? <View testID="board-locked-card" accessibilityLabel={cardLabel(lockedCard.kind)}><CardFace kind={lockedCard.kind} label={cardLabel(lockedCard.kind)} style={[styles.slotCard, compact && styles.compactSlotCard]} /></View> : !presentation && !canLock && lastRound ? <CardFace kind={lastRound.player} label={cardLabel(lastRound.player)} compact={compact} /> : null}
      </View>
    </View>
    <View style={[styles.playerZone, compact && styles.compactPlayer]}>
      <View style={styles.playerHeader}><View ref={playerRail} style={styles.playerDiscards}><Text numberOfLines={1} style={styles.discardLabel}>{discardLabel}</Text><View style={styles.discardCards}>{playerDiscards.map((kind, index) => <CardFace key={`${kind}-${index}`} kind={kind} label={cardLabel(kind)} small compact={compact} style={index > 0 ? { marginLeft: compact ? -15 : -22 } : undefined} />)}</View></View><View testID="board-player-score-column" style={styles.headerColumn}><ScorePlaque color="red" label={playerName} score={playerScore} style={[styles.playerScore, compact && styles.compactScore]} /></View><View style={styles.headerColumn}><View style={styles.boardTimer}>{canLock ? <ImageBackground testID="board-selection-timer" source={folkAssets.board.timerBadge} resizeMode="contain" style={styles.boardTimer}><Text style={styles.timerText}>{remaining}s</Text></ImageBackground> : null}</View></View></View>
      <View style={styles.hand}>
        {handCards.map((card, index) => <View key={card.id} style={[styles.handCard, compact && styles.compactHandCard, index > 0 && styles.handOverlap, { transform: [{ rotate: `${(index - (handCards.length - 1) / 2) * 4}deg` }] }]}><DraggableBoardCard card={card} compact={compact} selected={selectedCardId === card.id} canDrag={canLock && !busy} reducedMotion={reducedMotion} selectedLift={selectedLift} target={dropTarget} lockLabel={lockLabel} label={cardLabel(card.kind)} onSelect={onSelect} onLock={onLock} /></View>)}
      </View>
      <Text style={styles.boardStatus}>{summaryLabel ?? (presentation?.stage === 'prepare' && lockedCard ? `${selectedLabel}: ${cardLabel(lockedCard.kind)}` : presentation?.stage === 'outcome' && presentation.outcome === 'WIN' ? '+1' : presentation?.stage === 'outcome' && presentation.outcome === 'LOSS' ? `${opponentName} +1` : lockedCard ? selectedLabel : scoreLabel)}</Text>
    </View>
  </FolkSurface>;
}

export function FolkResultView({ title, outcome, scoreLabel, playerScore, opponentScore, roundLabel, history, cardLabel, primaryLabel, secondaryLabel, primaryDisabled, onPrimary, onSecondary }: {
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
}) {
  return <FolkSurface background="village"><ScrollView contentContainerStyle={styles.resultContent}>
    <FolkTitle style={styles.resultTitle}>{title}</FolkTitle>
    <View style={styles.outcomeStamp}><Text adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={2} style={styles.outcomeText}>{outcome}</Text></View>
    <ImageBackground testID="result-score" source={folkAssets.controls.redButton} resizeMode="stretch" imageStyle={styles.fillImage} style={styles.resultScore}><View style={styles.resultScoreContent}><Text adjustsFontSizeToFit numberOfLines={1} style={styles.resultScoreLabel}>{scoreLabel}</Text><Text adjustsFontSizeToFit numberOfLines={1} style={styles.resultScoreValue}>{playerScore} – {opponentScore}</Text></View></ImageBackground>
    <ImageBackground source={folkAssets.board.scrollPanel} resizeMode="stretch" imageStyle={styles.fillImage} style={styles.historyPanel}>
      <View style={styles.historyContent}>
      {history.map((row) => <View key={row.round} style={styles.historyRow}><CardFace kind={row.local} label={cardLabel(row.local)} small style={styles.historyCard} /><View testID={`result-round-copy-${row.round}`} style={styles.roundCopy}><Text style={styles.roundLabel}>{roundLabel} {row.round}</Text><Text style={styles.historyVs}>VS</Text></View><CardFace kind={row.opponent} label={cardLabel(row.opponent)} small style={styles.historyCard} /></View>)}
      </View>
    </ImageBackground>
    <View style={styles.resultActions}><FolkButton accessibilityLabel={primaryLabel} disabled={primaryDisabled} onPress={onPrimary} style={styles.resultButton}>{primaryLabel}</FolkButton><FolkButton variant="blue" accessibilityLabel={secondaryLabel} onPress={onSecondary} style={styles.resultButton}>{secondaryLabel}</FolkButton></View>
  </ScrollView></FolkSurface>;
}

export function FolkResultLoadingView({ label }: { readonly label: string }) {
  return <FolkSurface background="village" contentStyle={styles.resultLoading}><FolkTitle>{label}</FolkTitle></FolkSurface>;
}

export function FolkReconnectingView({ title, body, remaining }: { readonly title: string; readonly body: string; readonly remaining: number }) {
  return <FolkSurface background="woven" contentStyle={styles.reconnectBoard}>
    <View testID="reconnect-backdrop" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.reconnectBackdrop}>
      <ScorePlaque color="blue" label="VS" score="–" style={styles.reconnectTopScore} />
      <View style={styles.reconnectBacks}>{[0, 1, 2].map((item) => <FolkCardBack key={item} style={styles.opponentBack} />)}</View>
      <View style={styles.reconnectArena}><View style={styles.emptySlot} /><Image source={folkAssets.board.vs} resizeMode="contain" style={styles.vs} /><View style={styles.emptySlot} /></View>
    </View>
    <View style={styles.dim} />
    <View testID="reconnect-status" accessible accessibilityRole="alert" accessibilityLabel={`${title}. ${body} ${remaining}s`} accessibilityLiveRegion="polite" style={styles.reconnectModal}><Image source={folkAssets.decorations.drum} resizeMode="contain" style={styles.reconnectDrum} /><ImageBackground source={folkAssets.board.scrollPanel} resizeMode="stretch" style={styles.reconnectScroll}><Text accessibilityRole="header" adjustsFontSizeToFit minimumFontScale={0.8} numberOfLines={1} style={styles.reconnectTitle}>{title}</Text><Text numberOfLines={3} style={styles.reconnectBody}>{body}</Text><Text style={styles.reconnectCountdown}>{remaining}s</Text></ImageBackground></View>
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
  draftStatus: { color: '#5A3521', fontSize: 13, fontWeight: '700', textAlign: 'center' },
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
  opponentScore: { marginBottom: -18, zIndex: 1 },
  opponentTable: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', maxWidth: 360, paddingHorizontal: 8, width: '100%' },
  opponentHand: { flex: 1, flexDirection: 'row', gap: 3, justifyContent: 'center' },
  opponentBack: { height: 78, width: 52 },
  discardRail: { alignItems: 'center', minWidth: 70 },
  discardCards: { flexDirection: 'row', gap: 3, minHeight: 48 },
  discardLabel: { color: '#6F452C', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  arena: { alignItems: 'center', alignSelf: 'center', backgroundColor: 'rgba(247,230,176,0.62)', borderColor: '#C89949', borderRadius: 180, borderWidth: 2, height: 280, flexDirection: 'column', justifyContent: 'center', maxWidth: 280, width: '78%' },
  emptySlot: { borderColor: 'rgba(111,69,44,0.52)', borderRadius: 8, borderStyle: 'dashed', borderWidth: 2, height: 96, width: 64 },
  slotCard: { height: 108, width: 72 },
  compactSlotCard: { height: 72, width: 48 },
  slotFill: { height: '100%', width: '100%' },
  winnerCard: { borderColor: '#8A241A', borderWidth: 2, borderRadius: 8 },
  arenaStatus: { alignItems: 'center', flexDirection: 'row', height: 48, width: '95%' },
  roundStatus: { flex: 1, color: '#5A3521', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  dropSlot: { alignItems: 'center', borderColor: 'rgba(111,69,44,0.52)', borderRadius: 8, borderStyle: 'dashed', borderWidth: 2, height: 108, justifyContent: 'center', width: 72 },
  vs: { height: 56, marginVertical: 1, width: 56 },
  playerZone: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 252, paddingBottom: 3, paddingHorizontal: 8 },
  playerHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', maxWidth: 340, minHeight: 70, width: '100%' },
  playerScore: { alignSelf: 'center' },
  headerColumn: { alignItems: 'center', width: '33.333%' },
  playerDiscards: { alignItems: 'center', width: '33.333%' },
  hand: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'center', minHeight: 118 },
  handCard: { width: 92 },
  handOverlap: { marginLeft: -20 },
  compactOpponent: { minHeight: 112 },
  compactArena: { height: 194 },
  compactPlayer: { minHeight: 202 },
  compactScore: { height: 70, width: 78 },
  compactBack: { height: 52, width: 35 },
  compactFace: { height: 88, width: 58 },
  compactFaceSmall: { height: 48, width: 32 },
  compactEmptySlot: { height: 60, width: 42 },
  compactDropSlot: { height: 72, width: 48 },
  compactVs: { height: 40, width: 40 },
  compactCard: { height: 112, width: 78 },
  compactHandCard: { width: 78 },
  boardStatus: { color: '#FFF0C6', fontSize: 12, fontWeight: '800', minHeight: 17, textAlign: 'center', textShadowColor: '#43291F', textShadowOffset: { height: 1, width: 1 }, textShadowRadius: 1 },
  boardTimer: { alignItems: 'center', height: 58, justifyContent: 'center', width: 58 },
  resultContent: { alignItems: 'center', flexGrow: 1, justifyContent: 'center', paddingVertical: 6, paddingHorizontal: 16 },
  resultTitle: { height: 64 },
  outcomeStamp: { alignItems: 'center', backgroundColor: 'rgba(247,230,176,0.92)', borderColor: '#8A241A', borderRadius: 62, borderWidth: 7, height: 124, justifyContent: 'center', marginTop: -4, transform: [{ rotate: '-4deg' }], width: 124 },
  outcomeText: { color: '#8A241A', fontSize: 30, fontWeight: '900', padding: 10, textAlign: 'center' },
  resultScore: { marginTop: 8, maxWidth: '100%', overflow: 'hidden', width: 300 },
  resultScoreContent: { alignItems: 'center', flexDirection: 'row', gap: 14, minHeight: 60, justifyContent: 'center', paddingHorizontal: 48 },
  resultScoreLabel: { color: '#FFF0C6', fontSize: 14, fontWeight: '900', textShadowColor: '#43291F', textShadowOffset: { height: 1, width: 1 }, textShadowRadius: 1 },
  resultScoreValue: { color: '#FFF0C6', fontSize: 24, fontWeight: '900', textShadowColor: '#43291F', textShadowOffset: { height: 1, width: 1 }, textShadowRadius: 1 },
  historyPanel: { marginTop: -3, maxWidth: '100%', width: 320 },
  historyContent: { justifyContent: 'center', minHeight: 300, paddingBottom: 72, paddingHorizontal: 48, paddingTop: 72 },
  historyRow: { alignItems: 'center', borderBottomColor: 'rgba(117,88,70,0.22)', borderBottomWidth: 1, flexDirection: 'row', gap: 16, justifyContent: 'center', minHeight: 58 },
  historyCard: { height: 54, width: 36 },
  roundCopy: { alignItems: 'center', width: 72 },
  roundLabel: { color: '#5A3521', fontSize: 13, fontWeight: '900', textAlign: 'center' },
  historyVs: { color: '#8A241A', fontSize: 13, fontWeight: '900' },
  resultActions: { gap: 8, marginTop: 4, maxWidth: 340, width: '100%' },
  resultButton: { minHeight: 64 },
  resultLoading: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  reconnectBoard: { flex: 1 },
  reconnectBackdrop: { flex: 1 },
  reconnectTopScore: { left: 8, position: 'absolute', top: 4 },
  reconnectBacks: { alignSelf: 'center', flexDirection: 'row', gap: 4, marginTop: 62 },
  reconnectArena: { alignItems: 'center', alignSelf: 'center', flexDirection: 'row', marginTop: 56 },
  dim: { backgroundColor: 'rgba(24,14,10,0.72)', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  reconnectModal: { alignItems: 'center', bottom: 0, justifyContent: 'center', left: 18, position: 'absolute', right: 18, top: 0 },
  reconnectDrum: { height: 132, marginBottom: -40, width: 132, zIndex: 1 },
  reconnectScroll: { alignItems: 'center', height: 178, justifyContent: 'center', maxWidth: '100%', paddingHorizontal: 40, paddingTop: 22, width: 320 },
  reconnectTitle: { color: '#8A241A', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  reconnectBody: { color: '#5A3521', fontSize: 13, marginTop: 4, textAlign: 'center' },
  reconnectCountdown: { color: '#8A241A', fontSize: 27, fontWeight: '900', marginTop: 4 },
});
