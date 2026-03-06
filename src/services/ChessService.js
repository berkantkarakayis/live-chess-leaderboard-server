'use strict';

const LEADERBOARD_URL = 'https://api.chess.com/pub/leaderboards';
const POLL_INTERVAL_MS = 60 * 1000; // Chess.com updates ~every minute

const CATEGORIES = ['live_bullet', 'live_blitz', 'live_rapid'];

/** Convert Chess.com country URL to ISO code: "https://...country/NO" → "NO" */
function extractCountryCode(countryUrl) {
  if (!countryUrl) return null;
  return countryUrl.split('/').pop().toUpperCase();
}

/** ISO country code → emoji flag: "NO" → "🇳🇴" */
function countryCodeToFlag(code) {
  if (!code || code.length !== 2) return null;
  try {
    return [...code].map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join('');
  } catch {
    return null;
  }
}

/** Normalize a raw Chess.com player object into our schema */
function normalizePlayer(raw, index) {
  const countryCode = extractCountryCode(raw.country);
  return {
    id: String(raw.player_id),
    username: raw.username,
    name: raw.name || raw.username,
    rating: raw.score,
    rank: raw.rank ?? index + 1,
    countryCode,
    flag: countryCodeToFlag(countryCode),
    avatar: raw.avatar || null,
    trendScore: raw.trend_score?.direction ?? null,  // "up" | "down" | null
    trendRank: raw.trend_rank?.direction ?? null,
    profileUrl: `https://www.chess.com/member/${raw.username}`,
  };
}

class ChessService {
  constructor() {
    /** @type {Record<string, object[]>} */
    this.data = {};
    /** @type {number | null} */
    this.lastUpdated = null;
    this._pollTimer = null;
    this._callbacks = [];
  }

  /** Fetch leaderboard from Chess.com and normalize */
  async fetch(logger) {
    try {
      const res = await fetch(LEADERBOARD_URL, {
        headers: { 'User-Agent': 'live-leaderboard-app/1.0' },
      });
      if (!res.ok) throw new Error(`Chess.com API returned ${res.status}`);

      const json = await res.json();
      const updated = {};

      for (const cat of CATEGORIES) {
        updated[cat] = (json[cat] || []).slice(0, 50).map(normalizePlayer);
      }

      this.data = updated;
      this.lastUpdated = Date.now();
      logger?.info({ categories: CATEGORIES }, 'Chess.com leaderboard refreshed');
      return this.data;
    } catch (err) {
      logger?.error({ err }, 'Failed to fetch Chess.com leaderboard');
      return null;
    }
  }

  /** Start polling; calls onUpdate(data) on each successful fetch */
  startPolling(onUpdate, logger) {
    this.fetch(logger).then((d) => d && onUpdate(d));
    this._pollTimer = setInterval(async () => {
      const d = await this.fetch(logger);
      if (d) onUpdate(d);
    }, POLL_INTERVAL_MS);
  }

  stopPolling() {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  }

  getAll() { return this.data; }
  getCategory(cat) { return this.data[cat] || []; }
  getCategories() { return CATEGORIES; }
}

module.exports = new ChessService();
