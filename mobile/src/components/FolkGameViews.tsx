import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { CardKind } from '@rps-cards/game-core';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { FolkButton } from './FolkButton';
import { FolkCard, FolkCardBack } from './FolkCard';
import { FolkSurface } from './FolkSurface';
import { FolkTitle } from './FolkChrome';
import { folkAssets } from '../ui/folk-assets';
import type { RoundHistoryRow } from '../ui/round-history';

const cardArt = { ROCK: folkAssets.cards.rock, PAPER: folkAssets.cards.paper, SCISSORS: folkAssets.cards.scissors } as const;

function ScorePlaque({ score, label, color, style }: { readonly score: number | string; readonly label: string; readonly color: 'red' | 'blue'; readonly style?: object }) {
  return <ImageBackground source={color === 'red' ? folkAssets.board.scoreRed : folkAssets.board.scoreBlue} resizeMode="contain" style={[styles.scorePlaque, style]}><Text numberOfLines={1} adjustsFontSizeToFit style={styles.scoreLabel}>{label}</Text><Text style={styles.scoreValue}>{score}</Text></ImageBackground>;
}

function CardFace({ kind, label, small = false }: { readonly kind: CardKind; readonly label: string; readonly small?: boolean }) {
  return <View accessibilityLabel={label} style={[styles.cardFace, small && styles.cardFaceSmall]}><Image source={folkAssets.cards.frame} resizeMode="stretch" style={styles.cardFrame} /><Image source={cardArt[kind]} resizeMode="contain" style={[styles.cardArt, small && styles.cardArtSmall]} /></View>;
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
  return <FolkSurface background="woven" contentStyle={styles.draftSurface}>
    <FolkTitle style={styles.draftTitle}>{title}</FolkTitle>
    <ImageBackground source={folkAssets.controls.paperPanel} resizeMode="stretch" style={styles.opponentPanel}>
      <Image source={folkAssets.decorations.lion} resizeMode="contain" style={styles.opponentAvatar} />
      <View style={styles.opponentCopy}><Text style={styles.opponentName}>VS</Text><Text accessibilityLiveRegion="polite" style={styles.draftStatus}>{status}</Text></View>
    </ImageBackground>
    <View style={styles.draftCards}>
      {[0, 1, 2].map((position) => {
        const available = availablePositions.has(position);
        const slotDisabled = disabled || !available;
        return <Pressable key={position} testID={`draft-slot-${position}`} accessibilityRole="button" accessibilityLabel={`${cardBackLabel} ${position + 1}${available ? '' : `, ${unavailableLabel}`}`} accessibilityState={{ disabled: slotDisabled, selected: selectedPosition === position }} disabled={slotDisabled} onPress={available ? () => onPick(position) : undefined} style={[styles.draftChoice, !available && styles.draftUnavailable, selectedPosition === position && styles.draftSelected]}>
        <FolkCardBack label={cardBackLabel} style={styles.draftCardBack} />
        <Text style={styles.positionLabel}>{available ? position + 1 : '×'}</Text>
        </Pressable>;
      })}
    </View>
    <ImageBackground source={folkAssets.board.scrollPanel} resizeMode="stretch" style={styles.instructionScroll}>
      <Text numberOfLines={2} style={styles.instructionText}>{instruction}</Text>
      <ImageBackground source={folkAssets.board.timerBadge} resizeMode="contain" style={styles.draftTimer}><Text style={styles.timerText}>{timer}s</Text></ImageBackground>
    </ImageBackground>
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

function DraggableBoardCard({ card, selected, canDrag, reducedMotion, selectedLift, target, lockLabel, label, onSelect, onLock }: {
  readonly card: BoardCard;
  readonly selected: boolean;
  readonly canDrag: boolean;
  readonly reducedMotion: boolean;
  readonly selectedLift: number;
  readonly target: MeasuredBounds | null;
  readonly lockLabel: string;
  readonly label: string;
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
        <FolkCard kind={card.kind} label={label} selected={selected} disabled={!canDrag} accessibilityActions={selected && canDrag ? [{ name: 'lock', label: lockLabel }] : undefined} onAccessibilityAction={selected && canDrag ? (event) => { if (event.nativeEvent.actionName === 'lock') onLock(card.id); } : undefined} onPress={() => onSelect(card.id)} />
      </Animated.View>
    </GestureDetector>
  </View>;
}

export function FolkBoardView({ opponentName, playerName, scoreLabel, opponentScore, playerScore, opponentCardCount, opponentDiscards, playerDiscards, cards, selectedCardId, lockedCardId, canLock, busy, reducedMotion, lastRound, remaining, cardBackLabel, discardLabel, lockLabel, waitingLabel, selectedLabel, cardLabel, selectedLift, onSelect, onLock }: {
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
  const dropTargetRef = useRef<View>(null);
  const [dropTarget, setDropTarget] = useState<MeasuredBounds | null>(null);
  const lockedCard = cards.find((card) => card.id === lockedCardId) ?? null;
  const handCards = cards.filter((card) => card.id !== lockedCardId);
  const measureDropTarget = () => dropTargetRef.current?.measureInWindow((left, top, width, height) => setDropTarget({ x: left, y: top, width, height }));
  return <FolkSurface background="woven" contentStyle={styles.board}>
    <View style={styles.opponentZone}>
      <ScorePlaque color="blue" label={opponentName} score={opponentScore} style={styles.opponentScore} />
      <View style={styles.opponentTable}>
        <View style={styles.opponentHand}>{Array.from({ length: opponentCardCount }, (_, index) => <FolkCardBack key={index} label={cardBackLabel} style={styles.opponentBack} />)}</View>
        <View style={styles.discardRail}><Text numberOfLines={1} style={styles.discardLabel}>{discardLabel}</Text><View style={styles.discardCards}>{opponentDiscards.map((kind, index) => <CardFace key={`${kind}-${index}`} kind={kind} label={cardLabel(kind)} small />)}</View></View>
      </View>
    </View>
    <View testID="board-arena" accessibilityLabel="VS" style={styles.arena}>
      {!canLock && lastRound ? <CardFace kind={lastRound.opponent} label={cardLabel(lastRound.opponent)} /> : <View testID="board-opponent-slot" style={styles.emptySlot} />}
      <Image source={folkAssets.board.vs} resizeMode="contain" style={styles.vs} />
      <View ref={dropTargetRef} testID="board-drop-target" accessible accessibilityLabel={lockedCard ? `${selectedLabel}: ${cardLabel(lockedCard.kind)}` : lockLabel} accessibilityLiveRegion="polite" onLayout={measureDropTarget} style={styles.dropSlot}>
        {lockedCard ? <View testID="board-locked-card" accessibilityLabel={cardLabel(lockedCard.kind)}><CardFace kind={lockedCard.kind} label={cardLabel(lockedCard.kind)} /></View> : !canLock && lastRound ? <CardFace kind={lastRound.player} label={cardLabel(lastRound.player)} /> : null}
      </View>
    </View>
    <View style={styles.playerZone}>
      <View style={styles.playerHeader}><View style={styles.playerDiscards}><Text numberOfLines={1} style={styles.discardLabel}>{discardLabel}</Text><View style={styles.discardCards}>{playerDiscards.map((kind, index) => <CardFace key={`${kind}-${index}`} kind={kind} label={cardLabel(kind)} small />)}</View></View><ScorePlaque color="red" label={playerName} score={playerScore} style={styles.playerScore} /><ImageBackground source={folkAssets.board.timerBadge} resizeMode="contain" style={styles.boardTimer}><Text style={styles.timerText}>{remaining}s</Text></ImageBackground></View>
      <View style={styles.hand}>
        {handCards.map((card, index) => <View key={card.id} style={[styles.handCard, index > 0 && styles.handOverlap, { transform: [{ rotate: `${(index - (handCards.length - 1) / 2) * 4}deg` }] }]}><DraggableBoardCard card={card} selected={selectedCardId === card.id} canDrag={canLock && !busy} reducedMotion={reducedMotion} selectedLift={selectedLift} target={dropTarget} lockLabel={lockLabel} label={cardLabel(card.kind)} onSelect={onSelect} onLock={onLock} /></View>)}
      </View>
      <Text accessibilityLiveRegion="polite" style={styles.boardStatus}>{lockedCard ? selectedLabel : cards.length ? scoreLabel : waitingLabel}</Text>
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
    <ImageBackground testID="result-score" source={folkAssets.controls.redButton} resizeMode="stretch" style={styles.resultScore}><Text adjustsFontSizeToFit numberOfLines={1} style={styles.resultScoreLabel}>{scoreLabel}</Text><Text adjustsFontSizeToFit numberOfLines={1} style={styles.resultScoreValue}>{playerScore} – {opponentScore}</Text></ImageBackground>
    <ImageBackground source={folkAssets.board.scrollPanel} resizeMode="stretch" style={styles.historyPanel}>
      {history.map((row) => <View key={row.round} style={styles.historyRow}><CardFace kind={row.local} label={cardLabel(row.local)} small /><View testID={`result-round-copy-${row.round}`} style={styles.roundCopy}><Text style={styles.roundLabel}>{roundLabel} {row.round}</Text><Text style={styles.historyVs}>VS</Text></View><CardFace kind={row.opponent} label={cardLabel(row.opponent)} small /></View>)}
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
  cardFace: { alignItems: 'center', backgroundColor: '#F7E6B0', borderRadius: 8, height: 92, justifyContent: 'center', overflow: 'hidden', width: 60 },
  cardFaceSmall: { borderRadius: 5, height: 48, width: 32 },
  cardFrame: { bottom: 0, height: '100%', left: 0, position: 'absolute', width: '100%' },
  cardArt: { height: 48, width: 48 },
  cardArtSmall: { height: 25, width: 25 },
  draftSurface: { alignItems: 'center', flex: 1, paddingHorizontal: 12 },
  draftTitle: { height: 76, marginTop: 2 },
  opponentPanel: { alignItems: 'center', flexDirection: 'row', height: 94, justifyContent: 'center', marginTop: -2, maxWidth: '94%', paddingHorizontal: 30, width: 300 },
  opponentAvatar: { height: 68, width: 68 },
  opponentCopy: { flex: 1, marginLeft: 8 },
  opponentName: { color: '#8A241A', fontSize: 18, fontWeight: '900', textAlign: 'center' },
  draftStatus: { color: '#5A3521', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  draftCards: { alignItems: 'center', flexDirection: 'row', gap: 7, justifyContent: 'center', marginTop: 8 },
  draftChoice: { alignItems: 'center', borderColor: 'transparent', borderRadius: 12, borderWidth: 3, height: 132, justifyContent: 'center', width: 88 },
  draftUnavailable: { opacity: 0.55 },
  draftSelected: { backgroundColor: 'rgba(240,207,131,0.25)', borderColor: '#F0CF83', transform: [{ translateY: -6 }] },
  draftCardBack: { height: 112, width: 75 },
  positionLabel: { backgroundColor: '#8A241A', borderRadius: 11, bottom: 2, color: '#FFF0C6', fontSize: 12, fontWeight: '900', height: 22, lineHeight: 22, position: 'absolute', textAlign: 'center', width: 22 },
  instructionScroll: { alignItems: 'center', height: 92, justifyContent: 'center', marginTop: 7, maxWidth: '96%', paddingLeft: 32, paddingRight: 70, width: 310 },
  instructionText: { color: '#5A3521', fontSize: 13, fontWeight: '800', lineHeight: 18, textAlign: 'center' },
  draftTimer: { alignItems: 'center', height: 50, justifyContent: 'center', position: 'absolute', right: 2, width: 50 },
  timerText: { color: '#FFF0C6', fontSize: 15, fontWeight: '900', textShadowColor: '#43291F', textShadowOffset: { height: 1, width: 1 }, textShadowRadius: 1 },
  board: { flex: 1, justifyContent: 'center' },
  opponentZone: { alignItems: 'center', flex: 0.22, justifyContent: 'center', minHeight: 108, paddingHorizontal: 8 },
  opponentScore: { marginBottom: -18, zIndex: 1 },
  opponentTable: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', maxWidth: 360, paddingHorizontal: 8, width: '100%' },
  opponentHand: { flex: 1, flexDirection: 'row', gap: 3, justifyContent: 'center' },
  opponentBack: { height: 64, width: 43 },
  discardRail: { alignItems: 'center', minWidth: 70 },
  discardCards: { flexDirection: 'row', gap: 3, minHeight: 48 },
  discardLabel: { color: '#6F452C', fontSize: 10, fontWeight: '900', textAlign: 'center' },
  arena: { alignItems: 'center', alignSelf: 'center', backgroundColor: 'rgba(247,230,176,0.62)', borderColor: '#C89949', borderRadius: 180, borderWidth: 2, flex: 0.42, flexDirection: 'column', justifyContent: 'center', maxHeight: 300, maxWidth: 300, minHeight: 190, width: '78%' },
  emptySlot: { borderColor: 'rgba(111,69,44,0.52)', borderRadius: 8, borderStyle: 'dashed', borderWidth: 2, height: 72, width: 48 },
  dropSlot: { alignItems: 'center', borderColor: 'rgba(111,69,44,0.52)', borderRadius: 8, borderStyle: 'dashed', borderWidth: 2, height: 92, justifyContent: 'center', width: 60 },
  vs: { height: 42, marginVertical: 1, width: 42 },
  playerZone: { alignItems: 'center', flex: 0.36, justifyContent: 'flex-end', minHeight: 210, paddingBottom: 3, paddingHorizontal: 8 },
  playerHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', maxWidth: 340, minHeight: 70, width: '100%' },
  playerScore: { alignSelf: 'center' },
  playerDiscards: { alignItems: 'center', minWidth: 88 },
  hand: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'center', minHeight: 118 },
  handCard: { width: 82 },
  handOverlap: { marginLeft: -13 },
  boardStatus: { color: '#FFF0C6', fontSize: 12, fontWeight: '800', minHeight: 17, textAlign: 'center', textShadowColor: '#43291F', textShadowOffset: { height: 1, width: 1 }, textShadowRadius: 1 },
  boardTimer: { alignItems: 'center', height: 58, justifyContent: 'center', width: 58 },
  resultContent: { alignItems: 'center', paddingBottom: 8, paddingHorizontal: 16 },
  resultTitle: { height: 76 },
  outcomeStamp: { alignItems: 'center', backgroundColor: 'rgba(247,230,176,0.92)', borderColor: '#8A241A', borderRadius: 56, borderWidth: 7, height: 110, justifyContent: 'center', marginTop: -4, transform: [{ rotate: '-4deg' }], width: 110 },
  outcomeText: { color: '#8A241A', fontSize: 25, fontWeight: '900', padding: 10, textAlign: 'center' },
  resultScore: { alignItems: 'center', flexDirection: 'row', gap: 14, height: 78, justifyContent: 'center', marginTop: -2, maxWidth: '100%', paddingHorizontal: 32, width: 300 },
  resultScoreLabel: { color: '#FFF0C6', fontSize: 14, fontWeight: '900', textShadowColor: '#43291F', textShadowOffset: { height: 1, width: 1 }, textShadowRadius: 1 },
  resultScoreValue: { color: '#FFF0C6', fontSize: 24, fontWeight: '900', textShadowColor: '#43291F', textShadowOffset: { height: 1, width: 1 }, textShadowRadius: 1 },
  historyPanel: { justifyContent: 'center', marginTop: -3, maxWidth: '100%', minHeight: 300, paddingBottom: 48, paddingHorizontal: 34, paddingTop: 60, width: 320 },
  historyRow: { alignItems: 'center', borderBottomColor: 'rgba(117,88,70,0.22)', borderBottomWidth: 1, flexDirection: 'row', gap: 18, justifyContent: 'center', minHeight: 48 },
  roundCopy: { alignItems: 'center', width: 72 },
  roundLabel: { color: '#5A3521', fontSize: 13, fontWeight: '900', textAlign: 'center' },
  historyVs: { color: '#8A241A', fontSize: 13, fontWeight: '900' },
  resultActions: { maxWidth: 430, width: '100%' },
  resultButton: { minHeight: 60 },
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
