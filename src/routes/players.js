'use strict';

const { Router } = require('express');
const { z } = require('zod');
const playerService = require('../services/PlayerService');
const { broadcastExternal } = require('../ws/wsServer');

const router = Router();

const addPlayerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(32, 'Name must be 32 chars or less'),
});

router.get('/', (_req, res) => {
  res.json({ success: true, data: playerService.getAll() });
});

router.post('/', (req, res, next) => {
  try {
    const { name } = addPlayerSchema.parse(req.body);
    const player = playerService.addPlayer(name);
    broadcastExternal({ type: 'player_join', player });
    res.status(201).json({ success: true, data: player });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(422).json({ success: false, error: err.errors });
    }
    next(err);
  }
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const removed = playerService.removePlayer(id);
  if (!removed) {
    return res.status(404).json({ success: false, error: 'Player not found' });
  }
  broadcastExternal({ type: 'player_leave', playerId: id });
  res.status(204).send();
});

module.exports = router;
