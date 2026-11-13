export const LAN_VERSION = 1;
export const LAN_DEFAULT_PORT = 41234;
export interface LanAddress { readonly host: string; readonly port: number }
export interface LanInvitation extends LanAddress { readonly roomCode: string }

export function isLocalIPv4(host: string): boolean {
  if (!/^(0|[1-9]\d{0,2})(\.(0|[1-9]\d{0,2})){3}$/.test(host)) return false;
  const [a, b, c, d] = host.split('.').map(Number);
  if ([a, b, c, d].some((n) => n > 255)) return false;
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);
}

export function parseLanAddress(raw: string): LanAddress {
  const [host, rawPort, extra] = raw.trim().split(':');
  const port = rawPort === undefined ? LAN_DEFAULT_PORT : /^\d{1,5}$/.test(rawPort) ? Number(rawPort) : 0;
  if (extra !== undefined || !isLocalIPv4(host) || port < 1 || port > 65535) throw new Error('INVALID_ADDRESS');
  return { host, port };
}

export function encodeLanQr(invitation: LanInvitation): string {
  parseLanAddress(`${invitation.host}:${invitation.port}`);
  if (!/^[A-HJ-NP-Z2-9]{5}$/.test(invitation.roomCode)) throw new Error('INVALID_QR');
  return `baobuakeo://lan?v=${LAN_VERSION}&h=${invitation.host}&p=${invitation.port}&c=${invitation.roomCode}`;
}

export function decodeLanQr(raw: string): LanInvitation {
  const match = /^baobuakeo:\/\/lan\?v=(\d+)&h=([\d.]+)&p=(\d{1,5})&c=([A-HJ-NP-Z2-9]{5})$/.exec(raw);
  if (!match) throw new Error('INVALID_QR');
  if (match[1] !== String(LAN_VERSION)) throw new Error('INCOMPATIBLE_VERSION');
  try { return { ...parseLanAddress(`${match[2]}:${match[3]}`), roomCode: match[4] }; }
  catch { throw new Error('INVALID_QR'); }
}
