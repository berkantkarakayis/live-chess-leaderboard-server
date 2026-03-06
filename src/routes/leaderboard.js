'use strict';

const { Router } = require('express');
const chessService = require('../services/ChessService');

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    data: chessService.getAll(),
    lastUpdated: chessService.lastUpdated,
    categories: chessService.getCategories(),
  });
});

router.get('/:category', (req, res) => {
  const { category } = req.params;
  const valid = chessService.getCategories();
  if (!valid.includes(category)) {
    return res.status(400).json({
      success: false,
      error: `Invalid category. Valid: ${valid.join(', ')}`,
    });
  }
  res.json({
    success: true,
    data: chessService.getCategory(category),
    lastUpdated: chessService.lastUpdated,
  });
});

module.exports = router;
