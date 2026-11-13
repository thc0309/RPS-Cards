import React from 'react';
import { act, create } from 'react-test-renderer';
import { LanScreen } from './LanScreen';
import { TextInput } from 'react-native';

const mockReplace = jest.fn();
const mockRequest = jest.fn();
const mockStop = jest.fn();
const mockStart = jest.fn();
const mockConnect = jest.fn();
const mockRouter = { replace: mockReplace };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));
jest.mock('../store/app-store', () => ({ useAppStore: (select: (state: unknown) => unknown) => select({ locale: 'vi', setActiveRoom: jest.fn() }) }));
jest.mock('../security/reconnect-credential', () => ({ readReconnectCredential: async () => null, saveReconnectCredential: jest.fn() }));
jest.mock('../ui/feedback', () => ({ useFeedback: () => ({ play: jest.fn() }) }));
jest.mock('../lan/camera', () => ({ lanCamera: { request: () => mockRequest(), View: 'CameraFake' } }));
jest.mock('../lan/native', () => ({ scanLanRooms: () => mockStop, startLanHost: () => mockStart(), connectLanRoom: (...args: unknown[]) => mockConnect(...args) }));

beforeEach(() => { jest.clearAllMocks(); });
test('denied camera permission keeps manual fallback available and closes scan on Back', async () => {
  mockRequest.mockResolvedValue({ granted: false, canAskAgain: false });
  let tree: ReturnType<typeof create>;
  await act(async () => { tree = create(<LanScreen />); });
  expect(mockRequest).not.toHaveBeenCalled();
  const press = (label: string) => tree!.root.findAll((n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function')[0].props.onPress();
  await act(async () => { press('Quét mã QR'); });
  expect(tree!.root.findAll((n) => n.props.children === 'Chưa được phép dùng camera. Nhập địa chỉ bên dưới để vào phòng.').length).toBeGreaterThan(0);
  expect(tree!.root.findAll((n) => n.props.accessibilityLabel === 'Mở cài đặt').length).toBeGreaterThan(0);
  expect(tree!.root.findAllByType(TextInput)).toHaveLength(2);
  expect(mockConnect).not.toHaveBeenCalled();
  act(() => { press('Trang chủ'); });
  expect(mockStop).toHaveBeenCalled();
  act(() => tree!.unmount());
});

test('invalid QR keeps scanning; valid invitation closes camera and uses the normal join path', async () => {
  mockRequest.mockResolvedValue({ granted: true, canAskAgain: true });
  mockConnect.mockRejectedValue(new Error('HOST_UNREACHABLE'));
  let tree: ReturnType<typeof create>;
  await act(async () => { tree = create(<LanScreen />); });
  const scan = tree!.root.findAll((n) => n.props.accessibilityLabel === 'Quét mã QR' && typeof n.props.onPress === 'function')[0];
  await act(async () => scan.props.onPress());
  act(() => tree!.root.findByProps({ testID: 'lan-camera' }).props.onBarcodeScanned({ data: 'https://example.com' }));
  expect(tree!.root.findByProps({ testID: 'lan-camera' })).toBeDefined();
  await act(async () => tree!.root.findByProps({ testID: 'lan-camera' }).props.onBarcodeScanned({ data: 'baobuakeo://lan?v=1&h=192.168.1.23&p=41234&c=ABCD2' }));
  expect(tree!.root.findAllByProps({ testID: 'lan-camera' })).toHaveLength(0);
  expect(mockConnect).toHaveBeenCalledWith({ host: '192.168.1.23', port: 41234, roomCode: 'ABCD2' });
  act(() => tree!.unmount());
});
