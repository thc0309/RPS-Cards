import React from 'react';
import { ImageBackground, StyleSheet, Text } from 'react-native';
import { FolkResultView } from './FolkGameViews';
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
    const panelStyle = StyleSheet.flatten(panel!.props.style);
    const scoreBanner = tree!.root.findByProps({ testID: 'result-score' });
    const firstRoundCopy = tree!.root.findByProps({ testID: 'result-round-copy-1' });

    expect(scoreBanner.props.source).toBe(folkAssets.controls.redButton);
    expect(firstRoundCopy.findAllByType(Text).map((node: { props: { children: unknown } }) => node.props.children)).toEqual([
      ['Round', ' ', 1],
      'VS',
    ]);
    expect(panelStyle).toEqual(expect.objectContaining({ minHeight: 300, paddingTop: 60, paddingBottom: 48 }));
  });
});
