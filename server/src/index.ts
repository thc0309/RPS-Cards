import { Server } from 'colyseus';
import express from 'express';
import type { Request, Response } from 'express';
import { loadServerConfig } from './config.js';
import { WindowRateLimiter } from './rate-limit.js';
import { createRoomLog } from './rooms/logging.js';
import { ProtocolError } from '@rps-cards/game-core';
import { RoomDirectory } from './room-entry.js';

export function createGameServer(directory?: RoomDirectory) {
  const rooms = directory ?? new RoomDirectory(loadServerConfig());
  const server = new Server({
    express: (app) => {
      app.use(express.json({ limit: '16kb' }));
      // Per-address limits: polling stays cheap, room creation and code probing stay scarce.
      const general = new WindowRateLimiter(40, 1_000);
      const creation = new WindowRateLimiter(10, 60_000);
      const entry = new WindowRateLimiter(40, 60_000);
      const limited = (limiter: WindowRateLimiter) => (request: Request, response: Response, next: () => void) => {
        if (limiter.allow(request.ip ?? 'unknown')) { next(); return; }
        response.status(429).json({ error: { code: 'RATE_LIMITED' } });
      };
      app.use(limited(general));
      app.use('/rooms/create', limited(creation));
      app.use(['/rooms/validate', '/rooms/join'], limited(entry));
      app.get('/health', (_request: Request, response: Response) => response.json({ ok: true }));
      app.post('/rooms/create', (_request, response) => {
        try {
          response.status(201).json(rooms.create());
        } catch (error) {
          const code = error instanceof ProtocolError ? error.code : 'INVALID_MESSAGE';
          response.status(code === 'INVALID_MESSAGE' ? 400 : 500).json({ error: { code } });
        }
      });
      app.post('/rooms/validate', (request, response) => {
        const roomCode = typeof request.body?.roomCode === 'string' ? request.body.roomCode : '';
        response.json({ roomCode, status: rooms.validate(roomCode) });
      });
      app.post('/rooms/join', (request, response) => {
        try {
          const roomCode = typeof request.body?.roomCode === 'string' ? request.body.roomCode : '';
          const sessionId = typeof request.body?.sessionId === 'string' ? request.body.sessionId : undefined;
          response.json(rooms.join(roomCode, sessionId));
        } catch (error) {
          const code = error instanceof ProtocolError ? error.code : 'ROOM_NOT_FOUND';
          const status = code === 'ROOM_FULL' ? 409 : code === 'UNAUTHORIZED_SEAT' ? 403 : code === 'INVALID_MESSAGE' ? 400 : 404;
          response.status(status).json({ error: { code } });
        }
      });
      app.post('/rooms/reconnect', (request, response) => {
        try {
          const roomCode = typeof request.body?.roomCode === 'string' ? request.body.roomCode : '';
          const sessionId = typeof request.body?.sessionId === 'string' ? request.body.sessionId : '';
          const reconnectToken = typeof request.body?.reconnectToken === 'string' ? request.body.reconnectToken : '';
          response.json(rooms.reconnect(roomCode, sessionId, reconnectToken));
        } catch (error) {
          const code = error instanceof ProtocolError ? error.code : 'ROOM_EXPIRED';
          response.status(404).json({ error: { code } });
        }
      });
      app.get('/rooms/:roomCode/snapshot', (request, response) => {
        try {
          const room = rooms.get(request.params.roomCode);
          if (!room || typeof request.query.sessionId !== 'string') throw new ProtocolError('ROOM_EXPIRED', 'room is not available');
          room.authorize(request.query.sessionId, bearerToken(request));
          response.json(room.projection(request.query.sessionId));
        } catch (error) {
          const code = error instanceof ProtocolError ? error.code : 'ROOM_EXPIRED';
          response.status(404).json({ error: { code } });
        }
      });
      app.post('/rooms/:roomCode/action', (request, response) => {
        try {
          const room = rooms.get(request.params.roomCode);
          const sessionId = typeof request.body?.sessionId === 'string' ? request.body.sessionId : '';
          if (!room) throw new ProtocolError('ROOM_EXPIRED', 'room is not available');
          room.authorize(sessionId, bearerToken(request));
          const projection = room.handle(sessionId, request.body?.action);
          console.info(JSON.stringify(createRoomLog({ event: 'action_accepted', roomCode: room.roomCode, phase: projection.phase, round: projection.round, operationId: operationIdOf(request.body?.action) })));
          response.json(projection);
        } catch (error) {
          const code = error instanceof ProtocolError ? error.code : 'INVALID_MESSAGE';
          console.info(JSON.stringify(createRoomLog({ event: 'action_rejected', roomCode: String(request.params.roomCode).slice(0, 8), phase: 'unknown', round: 0, operationId: operationIdOf(request.body?.action), errorCode: code })));
          response.status(code === 'INVALID_MESSAGE' ? 400 : 409).json({ error: { code } });
        }
      });
      app.post('/rooms/:roomCode/leave', (request, response) => {
        try {
          const room = rooms.get(request.params.roomCode);
          const sessionId = typeof request.body?.sessionId === 'string' ? request.body.sessionId : '';
          if (!room) throw new ProtocolError('ROOM_EXPIRED', 'room is not available');
          room.authorize(sessionId, bearerToken(request));
          rooms.leave(request.params.roomCode, sessionId);
          response.json({ ok: true });
        } catch (error) {
          const code = error instanceof ProtocolError ? error.code : 'ROOM_EXPIRED';
          response.status(404).json({ error: { code } });
        }
      });
    },
  });
  return server;
}

function operationIdOf(action: unknown): string {
  return typeof action === 'object' && action !== null && 'operationId' in action && typeof action.operationId === 'string' ? action.operationId.slice(0, 80) : 'unknown';
}

function bearerToken(request: Request): string {
  const match = /^Bearer ([A-Za-z0-9-]{1,128})$/.exec(request.get('authorization') ?? '');
  return match?.[1] ?? '';
}

const config = loadServerConfig();
const server = createGameServer();
await server.listen(config.port, config.host);
console.log(JSON.stringify({
  event: 'server_started',
  host: config.host,
  port: config.port,
  draftSelectionTimeoutMs: config.draftSelectionTimeoutMs,
  roundSelectionTimeoutMs: config.roundSelectionTimeoutMs,
  reconnectTimeoutMs: config.reconnectTimeoutMs,
}));
