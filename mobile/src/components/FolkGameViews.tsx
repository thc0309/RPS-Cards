import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { CardKind } from '@rps-cards/game-core';
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

export function FolkDraftView({ title, status, instruction, timer, cardBackLabel, positions, selectedPosition, disabled, onPick }: {
  readonly title: string;
  readonly status: string;
  readonly instruction: string;
  readonly timer: number;
  readonly cardBackLabel: string;
  readonly positions: readonly number[];
  readonly selectedPosition: number | null;
  readonly disabled: boolean;
  readonly onPick: (position: number) => void;
}) {
  return <FolkSurface background="woven" contentStyle={styles.draftSurface}>
    <FolkTitle style={styles.draftTitle}>{title}</FolkTitle>
    <ImageBackground source={folkAssets.controls.paperPanel} resizeMode="stretch" style={styles.opponentPanel}>
      <Image source={folkAssets.decorations.lion} resizeMode="contain" style={styles.opponentAvatar} />
      <View style={styles.opponentCopy}><Text style={styles.opponentName}>VS</Text><Text accessibilityLiveRegion="polite" style={styles.draftStatus}>{status}</Text></View>
    </ImageBackground>
    <View style={styles.draftCards}>
      {positions.map((position) => <Pressable key={position} accessibilityRole="button" accessibilityLabel={`${cardBackLabel} ${position + 1}`} accessibilityState={{ disabled, selected: selectedPosition === position }} disabled={disabled} onPress={() => onPick(position)} style={[styles.draftChoice, selectedPosition === position && styles.draftSelected]}>
        <FolkCardBack label={cardBackLabel} style={styles.draftCardBack} />
        <Text style={styles.positionLabel}>{position + 1}</Text>
      </Pressable>)}
    </View>
    <ImageBackground source={folkAssets.board.scrollPanel} resizeMode="stretch" style={styles.instructionScroll}>
      <Text numberOfLines={2} style={styles.instructionText}>{instruction}</Text>
      <ImageBackground source={folkAssets.board.timerBadge} resizeMode="contain" style={styles.draftTimer}><Text style={styles.timerText}>{timer}s</Text></ImageBackground>
    </ImageBackground>
  </FolkSurface>;
}

export type BoardCard = { readonly id: string; readonly kind: CardKind };

export function FolkBoardView({ opponentName, playerName, scoreLabel, opponentScore, playerScore, opponentCardCount, opponentDiscards, playerDiscards, cards, selectedCardId, locked, busy, lastRound, remaining, cardBackLabel, lockLabel, waitingLabel, selectedLabel, cardLabel, selectedLift, onSelect, onLock }: {
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
  readonly locked: boolean;
  readonly busy: boolean;
  readonly lastRound: { readonly player: CardKind; readonly opponent: CardKind } | null;
  readonly remaining: number;
  readonly cardBackLabel: string;
  readonly lockLabel: string;
  readonly waitingLabel: string;
  readonly selectedLabel: string;
  readonly cardLabel: (kind: CardKind) => string;
  readonly selectedLift: number;
  readonly onSelect: (id: string) => void;
  readonly onLock: () => void;
}) {
  const lockDisabled = !selectedCardId || locked || busy;
  return <FolkSurface background="woven" contentStyle={styles.board}>
    <View style={styles.opponentZone}>
      <ScorePlaque color="blue" label={opponentName} score={opponentScore} style={styles.opponentScore} />
      <View style={styles.opponentHand}>{Array.from({ length: opponentCardCount }, (_, index) => <FolkCardBack key={index} label={cardBackLabel} style={styles.opponentBack} />)}</View>
      <View style={styles.discardRow}>{opponentDiscards.map((kind, index) => <CardFace key={`${kind}-${index}`} kind={kind} label={cardLabel(kind)} small />)}</View>
    </View>
    <View accessibilityLabel="VS" style={styles.arena}>
      {lastRound ? <CardFace kind={lastRound.opponent} label={cardLabel(lastRound.opponent)} /> : <View style={styles.emptySlot} />}
      <Image source={folkAssets.board.vs} resizeMode="contain" style={styles.vs} />
      {lastRound ? <CardFace kind={lastRound.player} label={cardLabel(lastRound.player)} /> : <View style={styles.emptySlot} />}
    </View>
    <View style={styles.playerZone}>
      <ScorePlaque color="red" label={playerName} score={playerScore} style={styles.playerScore} />
      <View style={styles.playerDiscards}>{playerDiscards.map((kind, index) => <CardFace key={`${kind}-${index}`} kind={kind} label={cardLabel(kind)} small />)}</View>
      <View style={styles.hand}>
        {cards.map((card, index) => <View key={card.id} style={[styles.handCard, index > 0 && styles.handOverlap, { transform: [{ rotate: `${(index - (cards.length - 1) / 2) * 4}deg` }] }]}><FolkCard kind={card.kind} label={cardLabel(card.kind)} selected={selectedCardId === card.id} disabled={busy || locked} onPress={() => onSelect(card.id)} style={selectedCardId === card.id ? { transform: [{ translateY: selectedLift }] } : undefined} /></View>)}
      </View>
      <Text accessibilityLiveRegion="polite" style={styles.boardStatus}>{locked ? selectedLabel : cards.length ? scoreLabel : waitingLabel}</Text>
      <View style={styles.lockRow}>
        <ImageBackground source={folkAssets.board.timerBadge} resizeMode="contain" style={styles.boardTimer}><Text style={styles.timerText}>{remaining}s</Text></ImageBackground>
        <FolkButton accessibilityLabel={lockLabel} disabled={lockDisabled} onPress={onLock} style={styles.lockButton}>{locked ? selectedLabel : lockLabel}</FolkButton>
      </View>
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

export function FolkReconnectingView({ title, body, remaining }: { readonly title: string; readonly body: string; readonly remaining: number }) {
  return <FolkSurface background="woven" contentStyle={styles.reconnectBoard}>
    <ScorePlaque color="blue" label="VS" score="–" style={styles.reconnectTopScore} />
    <View style={styles.reconnectBacks}>{[0, 1, 2].map((item) => <FolkCardBack key={item} style={styles.opponentBack} />)}</View>
    <View style={styles.reconnectArena}><View style={styles.emptySlot} /><Image source={folkAssets.board.vs} resizeMode="contain" style={styles.vs} /><View style={styles.emptySlot} /></View>
    <View style={styles.dim} />
    <View style={styles.reconnectModal}><Image source={folkAssets.decorations.drum} resizeMode="contain" style={styles.reconnectDrum} /><ImageBackground source={folkAssets.board.scrollPanel} resizeMode="stretch" style={styles.reconnectScroll}><Text accessibilityRole="header" adjustsFontSizeToFit minimumFontScale={0.8} numberOfLines={1} style={styles.reconnectTitle}>{title}</Text><Text numberOfLines={2} style={styles.reconnectBody}>{body}</Text><Text accessibilityLiveRegion="polite" style={styles.reconnectCountdown}>{remaining}s</Text></ImageBackground></View>
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
  draftSelected: { backgroundColor: 'rgba(240,207,131,0.25)', borderColor: '#F0CF83', transform: [{ translateY: -6 }] },
  draftCardBack: { height: 112, width: 75 },
  positionLabel: { backgroundColor: '#8A241A', borderRadius: 11, bottom: 2, color: '#FFF0C6', fontSize: 12, fontWeight: '900', height: 22, lineHeight: 22, position: 'absolute', textAlign: 'center', width: 22 },
  instructionScroll: { alignItems: 'center', height: 92, justifyContent: 'center', marginTop: 7, maxWidth: '96%', paddingLeft: 32, paddingRight: 70, width: 310 },
  instructionText: { color: '#5A3521', fontSize: 13, fontWeight: '800', lineHeight: 18, textAlign: 'center' },
  draftTimer: { alignItems: 'center', height: 50, justifyContent: 'center', position: 'absolute', right: 2, width: 50 },
  timerText: { color: '#FFF0C6', fontSize: 15, fontWeight: '900', textShadowColor: '#43291F', textShadowOffset: { height: 1, width: 1 }, textShadowRadius: 1 },
  board: { flex: 1 },
  opponentZone: { alignItems: 'center', flex: 0.3, justifyContent: 'center', minHeight: 142, paddingHorizontal: 8 },
  opponentScore: { left: 4, position: 'absolute', top: -5 },
  opponentHand: { flexDirection: 'row', gap: 3, marginTop: 2 },
  opponentBack: { height: 72, width: 48 },
  discardRow: { bottom: 0, flexDirection: 'row', gap: 4, minHeight: 48, position: 'absolute', right: 10 },
  arena: { alignItems: 'center', backgroundColor: 'rgba(65,37,24,0.62)', borderColor: '#E3BD62', borderWidth: 2, flexDirection: 'row', height: 108, justifyContent: 'center', paddingVertical: 6 },
  emptySlot: { borderColor: 'rgba(247,230,176,0.7)', borderRadius: 9, borderStyle: 'dashed', borderWidth: 2, height: 92, width: 60 },
  vs: { height: 58, marginHorizontal: 12, width: 58 },
  playerZone: { alignItems: 'center', flex: 0.7, justifyContent: 'flex-end', minHeight: 260, paddingBottom: 3, paddingHorizontal: 8 },
  playerScore: { position: 'absolute', right: 4, top: -6 },
  playerDiscards: { flexDirection: 'row', gap: 4, left: 8, minHeight: 48, position: 'absolute', top: 2 },
  hand: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'center', marginTop: 52, minHeight: 142 },
  handCard: { width: 82 },
  handOverlap: { marginLeft: -13 },
  boardStatus: { color: '#FFF0C6', fontSize: 12, fontWeight: '800', minHeight: 17, textAlign: 'center', textShadowColor: '#43291F', textShadowOffset: { height: 1, width: 1 }, textShadowRadius: 1 },
  lockRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 2, maxWidth: 330, width: '100%' },
  boardTimer: { alignItems: 'center', height: 58, justifyContent: 'center', marginRight: -8, width: 58, zIndex: 1 },
  lockButton: { flex: 1, minHeight: 64 },
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
  reconnectBoard: { flex: 1 },
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
