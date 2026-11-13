import { decodeLanQr, encodeLanQr, parseLanAddress } from './address';

test('round-trips an invitation containing no credentials', () => {
  const payload = encodeLanQr({ host: '192.168.1.23', port: 41234, roomCode: 'ABCD2' });
  expect(payload).toBe('baobuakeo://lan?v=1&h=192.168.1.23&p=41234&c=ABCD2');
  expect(decodeLanQr(payload)).toEqual({ host: '192.168.1.23', port: 41234, roomCode: 'ABCD2' });
  expect(parseLanAddress('192.168.1.23')).toEqual({ host: '192.168.1.23', port: 41234 });
});

test.each([
  'https://lan?v=1&h=192.168.1.23&p=41234&c=ABCD2',
  'baobuakeo://lan?v=1&h=8.8.8.8&p=41234&c=ABCD2',
  'baobuakeo://lan?v=1&h=127.0.0.1&p=41234&c=ABCD2',
  'baobuakeo://lan?v=1&h=192.168.1.23&p=65536&c=ABCD2',
  'baobuakeo://lan?v=1&h=192.168.1.23&p=0&c=ABCD2',
  'baobuakeo://lan?v=1&h=192.168.1.23&p=41234&c=ABCI2',
  'baobuakeo://lan?v=1&h=192.168.1.23&p=41234&c=ABCD2&token=secret',
  'baobuakeo://lan?v=1&v=1&h=192.168.1.23&p=41234&c=ABCD2',
])('rejects malformed or foreign QR: %s', (payload) => {
  expect(() => decodeLanQr(payload)).toThrow('INVALID_QR');
});

test('distinguishes incompatible versions and restricts IPv4', () => {
  expect(() => decodeLanQr('baobuakeo://lan?v=2&h=192.168.1.23&p=41234&c=ABCD2')).toThrow('INCOMPATIBLE_VERSION');
  for (const host of ['10.1.2.3', '172.16.0.1', '172.31.255.254', '169.254.1.1']) expect(parseLanAddress(host).host).toBe(host);
  for (const host of ['172.32.0.1', '192.168.0.256', '0.0.0.0', '192.168.01.1', '192.168.1.1:abc']) expect(() => parseLanAddress(host)).toThrow('INVALID_ADDRESS');
});
