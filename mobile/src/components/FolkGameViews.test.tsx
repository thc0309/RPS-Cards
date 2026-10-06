import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { FolkBoardView, FolkDraftView, FolkReconnectingView, FolkResultView, isCardCenterInsideDropTarget } from './FolkGameViews';
import { FolkButton } from './FolkButton';
import { getRoundPresentation } from '../game/board-round-presentation';
import { folkAssets } from '../ui/folk-assets';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { act, create } = require('react-test-renderer');

describe('FolkResultView', () => {
  it('keeps four result rows inside the scroll artwork', () => {
    let tree: ReturnType<typeof create>;

    act(() => {
      tree = create(
        <FolkResultView
          title="Result"
          outcome="You win"
          scoreLabel="Score"
          playerScore={3}
          opponentScore={1}
          roundLabel="Round"
          history={[
            { round: 1, local: 'ROCK', opponent: 'SCISSORS' },
            { round: 2, local: 'PAPER', opponent: 'ROCK' },
            { round: 3, local: 'SCISSORS', opponent: 'PAPER' },
            { round: 4, local: 'ROCK', opponent: 'SCISSORS' },
          ]}
          cardLabel={(kind) => kind}
          primaryLabel="Rematch"
          secondaryLabel="Home"
          onPrimary={() => undefined}
          onSecondary={() => undefined}
        />,
      );
    });

    const panel = tree!.root
      .findAllByType(ImageBackground)
      .find((node: { props: { source?: unknown } }) => node.props.source === folkAssets.board.scrollPanel);
    const scoreBanner = tree!.root.findByProps({ testID: 'result-score' });
    const firstRoundCopy = tree!.root.findByProps({ testID: 'result-round-copy-1' });

    expect(scoreBanner.props.source).toBe(folkAssets.controls.redButton);
    expect(firstRoundCopy.findAllByType(Text).map((node: { props: { children: unknown } }) => node.props.children)).toEqual([
      ['Round', ' ', 1],
      'VS',
    ]);
    expect(panel!.findAllByType(View).filter((node: { props: { testID?: string } }) => node.props.testID?.startsWith('result-round-copy-'))).toHaveLength(4);
  });
});

describe('FolkDraftView', () => {
  it('keeps three visual slots when only two authoritative positions remain', () => {
    const onPick = jest.fn();
    let tree: ReturnType<typeof create>;

    act(() => {
      tree = create(<FolkDraftView title="Draft" status="Available" instruction="Pick" timer={5} cardBackLabel="Card back" unavailableLabel="Unavailable" positions={[0, 1]} selectedPosition={null} disabled={false} onPick={onPick} />);
    });

    const slots = [0, 1, 2].map((position) => tree!.root.findAll((node: { props: { testID?: string } }) => node.props.testID === `draft-slot-${position}`)[0]);
    expect(slots).toHaveLength(3);
    expect(slots[2].props.accessibilityLabel).toBe('Card back 3, Unavailable');
    expect(slots[2].props.accessibilityState).toEqual({ disabled: true, selected: false });
    expect(slots[2].props.onPress).toBeUndefined();

    act(() => { slots[0].props.onPress(); });
    expect(onPick).toHaveBeenCalledWith(0);
  });
});

describe('FolkBoardView', () => {
  it('keeps a vertical arena, held card and accessible drag-only lock', () => {
    const onLock = jest.fn();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(<FolkBoardView opponentName="Opponent" playerName="You" scoreLabel="Available" opponentScore={0} playerScore={0} opponentCardCount={4} opponentDiscards={[]} playerDiscards={[]} cards={[{ id: 'a', kind: 'ROCK' }, { id: 'b', kind: 'PAPER' }]} selectedCardId="b" lockedCardId="a" canLock busy={false} reducedMotion={false} lastRound={null} remaining={15} cardBackLabel="Card back" discardLabel="Discards" lockLabel="Lock" waitingLabel="Waiting" selectedLabel="Selected" cardLabel={(kind) => kind} selectedLift={-6} onSelect={() => undefined} onLock={onLock} />);
    });

    const arena = tree!.root.findAll((node: { props: { testID?: string } }) => node.props.testID === 'board-arena')[0];
    const target = tree!.root.findAll((node: { props: { testID?: string } }) => node.props.testID === 'board-drop-target')[0];
    const heldCard = tree!.root.findAll((node: { props: { testID?: string } }) => node.props.testID === 'board-locked-card')[0];
    const selectedCard = tree!.root.findAll((node: { props: { accessibilityActions?: unknown } }) => Array.isArray(node.props.accessibilityActions))[0];
    expect(StyleSheet.flatten(arena.props.style)).toEqual(expect.objectContaining({ flexDirection: 'column' }));
    expect(target).toBeDefined();
    expect(StyleSheet.flatten(tree!.root.findByProps({ testID: 'board-player-score-column' }).props.style)).toEqual(expect.objectContaining({ width: '33.333%', alignItems: 'center' }));
    expect(heldCard.props.accessibilityLabel).toBe('ROCK');
    expect(tree!.root.findAllByType(FolkButton)).toHaveLength(0);

    act(() => { selectedCard.props.onAccessibilityAction({ nativeEvent: { actionName: 'lock' } }); });
    expect(onLock).toHaveBeenCalledTimes(1);
    expect(onLock).toHaveBeenCalledWith('b');
  });

  it('commits only when the dragged card center is inside the measured target', () => {
    const card = { x: 20, y: 100, width: 80, height: 120 };
    const target = { x: 100, y: 20, width: 60, height: 90 };
    expect(isCardCenterInsideDropTarget(card, target, 70, -90)).toBe(true);
    expect(isCardCenterInsideDropTarget(card, target, 20, -20)).toBe(false);
  });

  it('clears the previous reveal from both placeholders during selection', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(<FolkBoardView opponentName="Opponent" playerName="You" scoreLabel="Available" opponentScore={0} playerScore={0} opponentCardCount={3} opponentDiscards={['ROCK']} playerDiscards={['PAPER']} cards={[{ id: 'a', kind: 'SCISSORS' }]} selectedCardId={null} lockedCardId={null} canLock busy={false} reducedMotion={false} lastRound={{ player: 'PAPER', opponent: 'ROCK' }} remaining={15} cardBackLabel="Card back" discardLabel="Discards" lockLabel="Lock" waitingLabel="Waiting" selectedLabel="Selected" cardLabel={(kind) => kind} selectedLift={-6} onSelect={() => undefined} onLock={() => undefined} />);
    });

    expect(tree!.root.findByProps({ testID: 'board-opponent-slot' })).toBeDefined();
    expect(tree!.root.findByProps({ testID: 'board-drop-target' }).findAllByProps({ accessibilityLabel: 'PAPER' })).toHaveLength(0);
  });
});

describe('FolkReconnectingView', () => {
  it('hides the dimmed board controls and exposes one useful live status', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(<FolkReconnectingView title="Reconnecting" body="Your seat is reserved. Keep the app open." remaining={23} />);
    });

    const backdrop = tree!.root.findByProps({ testID: 'reconnect-backdrop' });
    const status = tree!.root.findByProps({ testID: 'reconnect-status' });
    expect(backdrop.props.accessibilityElementsHidden).toBe(true);
    expect(backdrop.props.importantForAccessibility).toBe('no-hide-descendants');
    expect(status.props.accessibilityLiveRegion).toBe('polite');
    expect(status.props.accessibilityLabel).toContain('23s');
  });
});

test('preparation hides opponent faces and selection timer; reveal uses equal slots and non-color outcome', () => {
  const timeline = { round: 1, revealAt: 1000, completeAt: 3100 };
  const round = { round: 1, outcomeForA: 'WIN' as const, playerA: { cardId: 'a', kind: 'ROCK' }, playerB: { cardId: 'b', kind: 'SCISSORS' } };
  const props = { opponentName: 'Opponent', playerName: 'You', scoreLabel: 'Available', opponentScore: 0, playerScore: 0, opponentCardCount: 4, opponentLocked: true, opponentDiscards: [], playerDiscards: [], cards: [{ id: 'a', kind: 'ROCK' as const }], selectedCardId: null, lockedCardId: 'a', canLock: false, busy: false, reducedMotion: true, lastRound: null, remaining: 0, cardBackLabel: 'Hidden', discardLabel: 'Discards', lockLabel: 'Lock', waitingLabel: 'Waiting', selectedLabel: 'Selected', cardLabel: (kind: string) => kind, selectedLift: 0, onSelect: jest.fn(), onLock: jest.fn() };
  let tree: ReturnType<typeof create>;
  act(() => { tree = create(<FolkBoardView {...props} presentation={getRoundPresentation('ROUND_REVEAL', 1, timeline, null, 900, 'PLAYER_A')} statusLabel="Both locked" />); });
  expect(tree!.root.findAllByProps({ accessibilityLabel: 'SCISSORS' })).toHaveLength(0);
  expect(tree!.root.findAllByProps({ testID: 'board-selection-timer' })).toHaveLength(0);
  const opponent = StyleSheet.flatten(tree!.root.findByProps({ testID: 'board-opponent-slot' }).props.style);
  const own = StyleSheet.flatten(tree!.root.findByProps({ testID: 'board-drop-target' }).props.style);
  expect([opponent.width, opponent.height]).toEqual([own.width, own.height]);
  act(() => { tree!.update(<FolkBoardView {...props} lockedCardId={null} presentation={getRoundPresentation('ROUND_RESULT', 1, timeline, round, 1700, 'PLAYER_A')} statusLabel="✓ You win this round" />); });
  expect(tree!.root.findByProps({ testID: 'board-drop-target' }).props.accessibilityLabel).toBe('ROCK');
  expect(tree!.root.findByProps({ testID: 'board-round-status' }).props.children).toBe('✓ You win this round');
  act(() => tree!.unmount());
});
