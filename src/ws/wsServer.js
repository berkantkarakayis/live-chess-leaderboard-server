'use strict';

const { WebSocketServer, WebSocket } = require('ws');

/** @type {Set<WebSocket>} */
const clients = new Set();

function broadcast(data) {
  const msg = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

/**
 * Attach WebSocket server to an existing HTTP server (shares the same port).
 * This is required for single-port deployment on Render / Railway.
 * @param {import('http').Server} httpServer
 * @param {import('pino').Logger} logger
 * @param {() => object} getLatestData  fn that returns current leaderboard data
 */
function initWsServer(httpServer, logger, getLatestData) {
  const wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws, req) => {
    clients.add(ws);
    logger.info({ clientCount: clients.size, ip: req.socket.remoteAddress }, 'WS client connected');

    // Send the latest cached data immediately on connect
    const latest = getLatestData();
    if (latest && Object.keys(latest).length > 0) {
      ws.send(JSON.stringify({ type: 'init', data: latest }));
    } else {
      ws.send(JSON.stringify({ type: 'waiting', message: 'Fetching data...' }));
    }

    ws.on('close', () => {
      clients.delete(ws);
      logger.info({ clientCount: clients.size }, 'WS client disconnected');
    });

    ws.on('error', (err) => {
      logger.error({ err }, 'WS client error');
      clients.delete(ws);
    });
  });

  return wss;
}

function getClientCount() {
  return clients.size;
}

module.exports = { initWsServer, broadcast, getClientCount };
