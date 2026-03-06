'use strict';

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  const logger = req.log || console;
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ success: false, error: 'Internal server error' });
}

module.exports = errorHandler;
