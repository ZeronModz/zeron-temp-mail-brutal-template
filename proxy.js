/* ==================================================================
   ZERON TEMP MAIL — universal proxy CORE (one core, every host)
   ------------------------------------------------------------------
   This file does NOT know what host it runs on. Thin adapters call
   run() and translate the result to their platform:

     run(body)  ->  Promise<{ status, headers, body }>

   Adapters shipped:
     - Vercel          api/index.js              -> proxy.expressHandler
     - Netlify         netlify/functions/api.js  -> proxy.eventHandler
     - Cloudflare Pages functions/api.js         -> proxy.eventHandler
     - Node server     server.js                 -> proxy.expressHandler
       (Render / Railway / Heroku / Fly.io / Koyeb / any VPS)
     - PHP shared host api.php                   -> independent cURL copy

   Key resolution order (server-side only):
     1. Env var  ZERON_API_KEY | API_KEY
     2. Node-hosts (server.js) may preload config.json into the env
        before requiring this module — so keep this file env-only for
        safest bundling on Vercel / Netlify / Cloudflare.

   No dependency. No build step. Works on Node >= 14 and every bundled
   serverless runtime (global fetch or https fallback).
   ================================================================== */

var DEFAULT_BASE = "https://dev-zeron-temp-gmail-api-v1.vercel.app";

var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "X-Content-Type-Options": "nosniff"
};

function key() {
  return process.env.ZERON_API_KEY || process.env.API_KEY || "";
}

function base() {
  var b = process.env.ZERON_API_BASE || DEFAULT_BASE;
  return String(b).replace(/\/+$/, "");
}

function parseBody(raw) {
  if (raw && typeof raw === "object") return raw;
  if (!raw) return {};
  try { return JSON.parse(raw); } catch (e) { return {}; }
}

function jsonBody(obj) { return JSON.stringify(obj || {}); }

/* ---------------- run -------------------- */
/* opts: { key?, base? } so runtimes with their own env (Cloudflare
   context.env, Deno, Bun) can pass values in. */
function run(body, opts) {
  opts = opts || {};
  var k = opts.key || key();
  var b = opts.base || base();
  var method = String(body.method || "GET").toUpperCase();
  var path = String(body.path || "").replace(/^\/+|\/+$/g, "");
  var headers = Object.assign({}, CORS, { "Content-Type": "application/json" });

  if (!path) {
    return Promise.resolve({
      status: 400, headers: headers,
      body: jsonBody({ status: false, message: 'Missing "path", e.g. { "path": "generate/mixed" }' })
    });
  }
  if (!k) {
    return Promise.resolve({
      status: 500, headers: headers,
      body: jsonBody({ status: false, message: "No API key configured. Set env ZERON_API_KEY (Node hosts: or config.json; PHP hosts: api.php $API_KEY) and redeploy." })
    });
  }

  var target = b + "/api/" + path + qstring(body.query);
  return httpFetch(target, k, method, body.data)
    .then(function (r) {
      return {
        status: r.status,
        headers: Object.assign({}, CORS, r.headers),
        body: r.text
      };
    })
    .catch(function (err) {
      return { status: 502, headers: headers, body: jsonBody({ status: false, message: "Upstream error: " + err.message }) };
    });
}

function qstring(q) {
  var p = new URLSearchParams();
  Object.keys(q || {}).forEach(function (k) {
    var v = q[k];
    if (v !== undefined && v !== null && String(v) !== "") p.append(k, String(v));
  });
  var s = p.toString();
  return s ? "?" + s : "";
}

/* ---------------- transport -------------- */
function httpFetch(target, token, method, data) {
  var auth = { "Authorization": "Bearer " + token, "Accept": "application/json" };
  var pData = (data && method === "POST") ? JSON.stringify(data) : null;

  if (typeof fetch === "function") {
    var init = { method: method, headers: auth };
    if (pData) { init.body = pData; init.headers["Content-Type"] = "application/json"; }
    return fetch(target, init).then(function (up) {
      return up.text().then(function (t) {
        return {
          status: up.status,
          headers: { "Content-Type": up.headers.get("content-type") || "application/json" },
          text: t
        };
      });
    });
  }
  return nodeFetch(target, token, method, pData);
}

function nodeFetch(target, token, method, pData) {
  var lib = target.indexOf("https:") === 0 ? require("https") : require("http");
  var u = new URL(target);
  var opts = {
    hostname: u.hostname,
    path: u.pathname + u.search,
    method: method,
    headers: { "Authorization": "Bearer " + token, "Accept": "application/json" }
  };
  if (pData) {
    opts.headers["Content-Type"] = "application/json";
    opts.headers["Content-Length"] = Buffer.byteLength(pData);
  }
  return new Promise(function (resolve, reject) {
    var pr = lib.request(opts, function (up) {
      var chunks = [];
      up.on("data", function (c) { chunks.push(c); });
      up.on("end", function () {
        resolve({
          status: up.statusCode,
          headers: { "Content-Type": up.headers["content-type"] || "application/json" },
          text: Buffer.concat(chunks)
        });
      });
    });
    pr.on("error", reject);
    if (pData) pr.write(pData);
    pr.end();
  });
}

/* ---------------- express-style handler (Vercel / Node server) ----
   Accepts req.body as object OR string. */
function expressHandler(req, res) {
  Object.keys(CORS).forEach(function (h) { res.setHeader(h, CORS[h]); });
  if (req.method === "OPTIONS") { res.statusCode = 204; res.end(); return; }

  var raw;
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) raw = req.body;
  else if (typeof req.body === "string") raw = req.body;
  else raw = "";

  run(parseBody(raw)).then(function (r) {
    res.statusCode = r.status;
    Object.keys(r.headers).forEach(function (h) { res.setHeader(h, r.headers[h]); });
    res.end(r.body || "");
  }).catch(function (err) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(jsonBody({ status: false, message: "Proxy error: " + err.message }));
  });
}

/* ---------------- serverless event handler (Netlify / CF) ---------
   Compatible with { statusCode, headers, body } conventions. */
function eventHandler(body) {
  return run(parseBody(body)).then(function (r) {
    return { statusCode: r.status, headers: r.headers, body: r.body };
  });
}

module.exports = {
  run: run,
  parseBody: parseBody,
  expressHandler: expressHandler,
  eventHandler: eventHandler,
  DEFAULT_BASE: DEFAULT_BASE
};