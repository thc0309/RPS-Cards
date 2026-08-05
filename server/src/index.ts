import { createServer } from 'node:http';
import { loadServerConfig } from './config.js';

const config = loadServerConfig();

const server = createServer((request, response) => {
  if (request.method === 'GET' && request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  response.writeHead(404, { 'content-type': 'application/json' });
  response.end(JSON.stringify({ error: { code: 'NOT_FOUND' } }));
});

server.listen(config.port, config.host, () => {
  console.log(
    JSON.stringify({
      event: 'server_started',
      host: config.host,
      port: config.port,
      draftSelectionTimeoutMs: config.draftSelectionTimeoutMs,
      roundSelectionTimeoutMs: config.roundSelectionTimeoutMs,
      reconnectTimeoutMs: config.reconnectTimeoutMs,
    }),
  );
});
