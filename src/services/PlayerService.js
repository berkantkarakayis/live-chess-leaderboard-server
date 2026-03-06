'use strict';

const { randomUUID } = require('crypto');

const INITIAL_NAMES = [
  'AlphaWolf', 'NeonStar', 'CyberFox', 'StormRider',
  'BlazePulse', 'IronVoid', 'ShadowByte', 'QuantumAce',
];

class PlayerService {
  constructor() {
    /** @type {Map<string, {id: string, name: string, score: number, avatar: string}>} */
    this.players = new Map();
    this._seed();
  }

  _seed() {
    for (const name of INITIAL_NAMES) {
      const id = randomUUID();
      this.players.set(id, {
        id,
        name,
        score: Math.floor(Math.random() * 1000),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      });
    }
  }

  /** Returns all players sorted by score desc with rank computed */
  getAll() {
    return Array.from(this.players.values())
      .sort((a, b) => b.score - a.score)
      .map((player, index) => ({ ...player, rank: index + 1 }));
  }

  /**
   * Update a player's score by delta. Score floor is 0.
   * @returns {{ player: object, allPlayers: object[] } | null}
   */
  updateScore(id, delta) {
    const player = this.players.get(id);
    if (!player) return null;

    player.score = Math.max(0, player.score + delta);
    this.players.set(id, player);

    const allPlayers = this.getAll();
    const updated = allPlayers.find((p) => p.id === id);
    return { player: updated, allPlayers };
  }

  /**
   * Add a new player with score 0.
   * @returns {object} player with rank
   */
  addPlayer(name) {
    const id = randomUUID();
    this.players.set(id, {
      id,
      name,
      score: 0,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    });
    const allPlayers = this.getAll();
    return allPlayers.find((p) => p.id === id);
  }

  /**
   * Remove a player.
   * @returns {boolean}
   */
  removePlayer(id) {
    return this.players.delete(id);
  }

  count() {
    return this.players.size;
  }

  /** Pick a random player id */
  randomId() {
    const ids = Array.from(this.players.keys());
    return ids[Math.floor(Math.random() * ids.length)];
  }
}

module.exports = new PlayerService();
