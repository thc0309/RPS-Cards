import React from 'react';
import { act, create } from 'react-test-renderer';
import { FolkCard, FolkCardBack } from './FolkCard';

let mockPlayed: string[] = [];
jest.mock('../ui/feedback', () => ({ useFeedback: () => ({ play: (cue: string) => { mockPlayed.push(cue); } }) }));
jest.mock('../ui/motion', () => ({ usePressMotion: () => ({ style: {}, onPressIn: () => undefined, onPressOut: () => undefined }) }));
let tree: ReturnType<typeof create>;
afterEach(() => { act(() => { tree.unmount(); }); mockPlayed = []; });

test('only a selected card tap emits paper selection; accessible lock remains its own action', () => {
  const select = jest.fn();
  const lock = jest.fn();
  act(() => { tree = create(<FolkCard kind="ROCK" label="Búa" selected onPress={select} accessibilityActions={[{ name: 'lock', label: 'Chốt' }]} onAccessibilityAction={lock} />); });
  const press = tree.root.findAllByProps({ accessibilityRole: 'button' })[0];
  act(() => { press.props.onPressIn?.(); press.props.onPressOut?.(); });
  expect(mockPlayed).toEqual([]);
  act(() => { press.props.onPress({ nativeEvent: {} }); });
  expect(select).toHaveBeenCalledTimes(1);
  expect(mockPlayed).toEqual(['paper-select']);
  act(() => { press.props.onAccessibilityAction({ nativeEvent: { actionName: 'lock' } }); });
  expect(lock).toHaveBeenCalledTimes(1);
  expect(mockPlayed).toEqual(['paper-select']);
});

test('disabled cards cannot create selection or custom action feedback', () => {
  const action = jest.fn();
  act(() => { tree = create(<FolkCard kind="PAPER" label="Bao" disabled onPress={action} onAccessibilityAction={action} />); });
  const press = tree.root.findAllByProps({ accessibilityRole: 'button' })[0];
  act(() => { press.props.onPress?.({ nativeEvent: {} }); press.props.onAccessibilityAction?.({ nativeEvent: { actionName: 'lock' } }); });
  expect(action).not.toHaveBeenCalled();
  expect(mockPlayed).toEqual([]);
});

test('a decorative card back stays an image without interactive or audio behavior', () => {
  act(() => { tree = create(<FolkCardBack label="Lá bài úp" />); });
  expect(tree.root.findAllByProps({ accessibilityRole: 'button' })).toHaveLength(0);
  expect(mockPlayed).toEqual([]);
});
