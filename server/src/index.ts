import { Server } from 'colyseus';
import express from 'express';
import type { Request, Response } from 'express';
import { loadServerConfig } from './config.js';
import { RpsRoom } from './rooms/RpsRoom.js';
import { ProtocolError } from '@rps-cards/game-core';
import { RoomDirectory } from './room-entry.js';

export function createGameServer(directory?: RoomDirectory) {
  const rooms = directory ?? new RoomDirectory(loadServerConfig());
  const server = new Server({
    express: (app) => {
      app.use(express.json({ limit: '16kb' }));
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
          response.json(room.handle(sessionId, request.body?.action));
        } catch (error) {
          const code = error instanceof ProtocolError ? error.code : 'INVALID_MESSAGE';
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
  server.define('rps', RpsRoom);
  return server;
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
