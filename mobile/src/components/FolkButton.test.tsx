import React from 'react';
import { act, create } from 'react-test-renderer';
import { FolkButton } from './FolkButton';

let mockPlayed: string[] = [];
jest.mock('../ui/feedback', () => ({ useFeedback: () => ({ play: (cue: string) => { mockPlayed.push(cue); } }) }));
jest.mock('../ui/motion', () => ({ usePressMotion: () => ({ style: {}, onPressIn: () => undefined, onPressOut: () => undefined }) }));
let tree: ReturnType<typeof create>;
beforeEach(() => { mockPlayed = []; });
afterEach(() => { act(() => { tree.unmount(); }); });

test('cancelled or rapid presses never cue before activation; each activation acts once immediately', () => {
  let actions = 0;
  act(() => { tree = create(<FolkButton onPress={() => { actions += 1; }} accessibilityLabel="Play">Play</FolkButton>); });
  const press = tree.root.findAllByProps({ accessibilityRole: 'button' })[0];
  act(() => { press.props.onPressIn?.(); press.props.onPressOut?.(); });
  expect(mockPlayed).toEqual([]);
  expect(actions).toBe(0);
  act(() => { press.props.onPress(); });
  expect(actions).toBe(1);
  expect(mockPlayed).toEqual(['ui-tap']);
  act(() => { press.props.onPress(); });
  expect(actions).toBe(2);
  expect(mockPlayed).toEqual(['ui-tap', 'ui-tap']);
});

test('disabled control cannot act or cue', () => {
  const action = jest.fn();
  act(() => { tree = create(<FolkButton disabled onPress={action}>Play</FolkButton>); });
  const press = tree.root.findAllByProps({ accessibilityRole: 'button' })[0];
  act(() => { press.props.onPress?.(); });
  expect(press.props.accessibilityState).toEqual({ disabled: true });
  expect(action).not.toHaveBeenCalled();
  expect(mockPlayed).toEqual([]);
});

test('navigation can choose one paper cue without an extra tap', () => {
  const action = jest.fn();
  act(() => { tree = create(<FolkButton cue="paper-slide" onPress={action}>Rooms</FolkButton>); });
  act(() => { tree.root.findAllByProps({ accessibilityRole: 'button' })[0].props.onPress(); });
  expect(mockPlayed).toEqual(['paper-slide']);
  expect(action).toHaveBeenCalledTimes(1);
});

test('an accepted action can own its later success cue without a default tap', () => {
  const action = jest.fn();
  act(() => { tree = create(<FolkButton cue={null} onPress={action}>Rematch</FolkButton>); });
  act(() => { tree.root.findAllByProps({ accessibilityRole: 'button' })[0].props.onPress(); });
  expect(mockPlayed).toEqual([]);
  expect(action).toHaveBeenCalledTimes(1);
});
