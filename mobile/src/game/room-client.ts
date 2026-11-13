import { createOnlineRoomClient, type OnlineRoomClient } from './colyseus-client';
import type { ReconnectCredential } from '../security/reconnect-credential';
import type { LanRoomHandle } from '../lan/native';

let lanMode = false;
let lan: LanRoomHandle | undefined;
export function createRoomClient(): OnlineRoomClient { return lan?.client ?? createOnlineRoomClient(); }
export function roomEntryRoute(): '/lan' | '/rooms' { return lanMode ? '/lan' : '/rooms'; }
export function roomReconnectFailure() { return lanMode ? { pathname: '/lan' as const, params: { error: 'HOST_UNREACHABLE' } } : '/rooms' as const; }
export function lanSessionInfo() { return lan ? { ...lan.invitation, isHost: lan.isHost } : undefined; }
export function setLanRoom(handle: LanRoomHandle | undefined): void { if (lan !== handle) lan?.dispose(); lan = handle; lanMode = !!handle; }
export async function restoreRoomClient(credential: ReconnectCredential): Promise<OnlineRoomClient> {
  if (credential.transport !== 'lan') return createOnlineRoomClient();
  lanMode = true;
  if (!lan) {
    if (!credential.address || credential.isHost) throw new Error('HOST_UNREACHABLE');
    const { connectLanRoom } = await import('../lan/native');
    const { parseLanAddress } = await import('../lan/address');
    setLanRoom(await connectLanRoom({ ...parseLanAddress(credential.address), roomCode: credential.roomCode }));
  }
  return createRoomClient();
}
