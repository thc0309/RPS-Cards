import type { CardInstance, MatchState, PlayerId, PlayedCard } from '@rps-cards/game-core';
import type { PrivatePlayerProjection, PublicPlayerProjection, RoomProjection } from '@rps-cards/game-core';

export interface ProjectionPlayer {
  readonly seat: PlayerId;
  readonly hand: readonly CardInstance[];
  readonly draft: { readonly kind: string } | null;
  readonly score: number;
  readonly locked: boolean;
  readonly discards: readonly PlayedCard[];
}

export interface ProjectionState {
  readonly roomCode: string;
  readonly phase: MatchState['phase'] | 'WAITING';
  readonly round: number;
  readonly players: readonly ProjectionPlayer[];
}

function publicPlayer(player: ProjectionPlayer): PublicPlayerProjection {
  return {
    seat: player.seat,
    cardCount: player.hand.length,
    locked: player.locked,
    score: player.score,
    discards: player.discards.map(({ cardId, kind }) => ({ cardId, kind })),
    cardSkinId: 'folk_default',
    boardThemeId: 'folk_default',
  };
}

function privatePlayer(player: ProjectionPlayer): PrivatePlayerProjection {
  return {
    ...publicPlayer(player),
    hand: player.hand.map(({ id, kind, used }) => ({ id, kind, used })),
    draft: player.draft,
  };
}

export function buildProjection(state: ProjectionState, ownSeat: PlayerId): RoomProjection {
  const own = state.players.find((player) => player.seat === ownSeat);
  if (!own) throw new Error('UNAUTHORIZED_SEAT');
  return {
    rulesetVersion: 'classic_v1',
    roomCode: state.roomCode,
    phase: state.phase,
    round: state.round,
    players: state.players.map(publicPlayer),
    own: privatePlayer(own),
  };
}
