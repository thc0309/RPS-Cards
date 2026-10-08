import React from 'react';
import { act, create } from 'react-test-renderer';
import { FolkBackButton } from './FolkChrome';

let mockPlayed: string[] = [];
jest.mock('../ui/feedback', () => ({ useFeedback: () => ({ play: (cue: string) => { mockPlayed.push(cue); } }) }));
jest.mock('../ui/motion', () => ({ usePressMotion: () => ({ style: {}, onPressIn: () => undefined, onPressOut: () => undefined }) }));
let tree: ReturnType<typeof create>;
afterEach(() => { act(() => { tree.unmount(); }); mockPlayed = []; });

test('back activates one localized action and one route cue, without cancellation feedback', () => {
  const action = jest.fn();
  act(() => { tree = create(<FolkBackButton label="Trang chủ" cue="paper-slide" onPress={action} />); });
  const press = tree.root.findAllByProps({ accessibilityRole: 'button' })[0];
  act(() => { press.props.onPressIn?.(); press.props.onPressOut?.(); });
  expect(action).not.toHaveBeenCalled();
  expect(mockPlayed).toEqual([]);
  act(() => { press.props.onPress(); });
  expect(press.props.accessibilityLabel).toBe('Trang chủ');
  expect(action).toHaveBeenCalledTimes(1);
  expect(mockPlayed).toEqual(['paper-slide']);
});
