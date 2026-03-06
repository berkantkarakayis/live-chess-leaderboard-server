'use strict';

require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const pino = require('pino');
const pinoHttp = require('pino-http');

const chessService = require('./services/ChessService');
const leaderboardRouter = require('./routes/leaderboard');
const errorHandler = require('./middleware/errorHandler');
const { initWsServer, broadcast, getClientCount } = require('./ws/wsServer');

const PORT = parseInt(process.env.PORT || '3000', 10);
const logger = pino({ level: 'info' });

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(pinoHttp({ logger }));

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      lastUpdated: chessService.lastUpdated,
      wsConnections: getClientCount(),
    },
  });
});

app.use('/api/leaderboard', leaderboardRouter);
app.use(errorHandler);

// HTTP server — WebSocket attaches to this same server (single port for Render)
const server = http.createServer(app);

initWsServer(server, logger, () => chessService.getAll());

// Start polling Chess.com; broadcast full update to all WS clients on each refresh
chessService.startPolling((data) => {
  broadcast({ type: 'leaderboard_update', data, lastUpdated: chessService.lastUpdated });
}, logger);

server.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT} — HTTP + WebSocket on same port`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  chessService.stopPolling();
  server.close(() => process.exit(0));
});
