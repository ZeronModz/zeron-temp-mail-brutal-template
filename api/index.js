/*
 * ZERON TEMP MAIL — Vercel Serverless adapter (thin)
 * ------------------------------------------------------------------
 * Real logic lives in ../proxy.js (universal core). This file just
 * hands Vercel's (req, res) to the shared expressHandler.
 *
 * Env vars (Vercel dashboard → Settings → Environment Variables):
 *   ZERON_API_KEY = key_xxxx          (required)
 *   ZERON_API_BASE = <upstream>       (optional)
 */
module.exports = require("../proxy.js").expressHandler;