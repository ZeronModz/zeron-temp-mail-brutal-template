/*
 * ZERON TEMP MAIL — Netlify Functions adapter (thin)
 * ------------------------------------------------------------------
 * Real proxy logic lives in /proxy.js (universal core).
 *
 * Env vars (Netlify dashboard → Site settings → Environment variables):
 *   ZERON_API_KEY = key_xxxx     (required)
 *   ZERON_API_BASE               (optional, defaults to upstream)
 *
 * `_redirects` maps POST /api → this function so the frontend keeps
 * using the same /api URL as every other host.
 */
var proxy = require("../../proxy.js");

exports.handler = function (event) {
  return proxy.eventHandler(event.body);
};