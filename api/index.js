/*
 * ZERON TEMP MAIL — Vercel Serverless Proxy
 * ------------------------------------------------------------------
 * Keeps the DevZeron Temp Gmail API key SERVER-SIDE. Visitors never
 * see it. The site owner only sets ONE env var on the host:
 *
 *   ZERON_API_KEY = key_xxxx
 *
 * Optional:
 *   ZERON_API_BASE = https://dev-zeron-temp-gmail-api-v1.vercel.app   (default)
 *
 * Frontend calls this same-origin endpoint with a small JSON body:
 *   { "path": "generate/mixed", "query": { "limit": "10" } }
 * The proxy injects `Authorization: Bearer <key>` and forwards.
 */

var DEFAULT_BASE = "https://dev-zeron-temp-gmail-api-v1.vercel.app";

module.exports = function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  var body = {};
  try {
    body = (req.body && typeof req.body === "object")
      ? req.body
      : (req.body ? JSON.parse(req.body) : {});
  } catch (err) {
    body = {};
  }

  var path = String((body.path || "").replace(/^\/+|\/+$/g, ""));
  var key = process.env.ZERON_API_KEY || process.env.API_KEY || "";
  var base = (process.env.ZERON_API_BASE || DEFAULT_BASE).replace(/\/+$/, "");

  if (!path) return json(res, 400, { status: false, message: 'Missing "path", e.g. { "path": "generate/mixed" }' });
  if (!key) return json(res, 500, { status: false, message: "Server env ZERON_API_KEY not set. Add it to your host settings and redeploy." });

  var q = (body.query && typeof body.query === "object") ? body.query : {};
  var qs = new URLSearchParams();
  Object.keys(q).forEach(function (k) {
    var v = q[k];
    if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
  });
  var qstr = qs.toString();
  if (typeof fetch === "function") {
    forward(res, base + "/api/" + path + (qstr ? "?" + qstr : ""), key, body);
  } else {
    httpsCall(res, base + "/api/" + path + (qstr ? "?" + qstr : ""), key, body);
  }
};

function forward(res, target, key, body) {
  fetch(target, {
    method: body.method || "GET",
    headers: {
      "Authorization": "Bearer " + key,
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: body.method === "POST" && body.data ? JSON.stringify(body.data) : undefined
  }).then(function (up) {
    return up.text().then(function (text) {
      res.statusCode = up.status;
      res.setHeader("Content-Type", up.headers.get("content-type") || "application/json");
      res.end(text || "");
    });
  }).catch(function (err) {
    json(res, 502, { status: false, message: "Upstream error: " + err.message });
  });
}

function httpsCall(res, target, key, body) {
  var https = require("https");
  var http = require("http");
  var lib = target.indexOf("https:") === 0 ? https : http;
  var u = new URL(target);
  var opts = {
    hostname: u.hostname,
    path: u.pathname + u.search,
    method: body.method || "GET",
    headers: {
      "Authorization": "Bearer " + key,
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  };
  var pData = body.method === "POST" && body.data ? JSON.stringify(body.data) : null;
  if (pData) opts.headers["Content-Length"] = Buffer.byteLength(pData);
  var pr = lib.request(opts, function (up) {
    var chunks = [];
    up.on("data", function (c) { chunks.push(c); });
    up.on("end", function () {
      res.statusCode = up.statusCode;
      res.setHeader("Content-Type", up.headers["content-type"] || "application/json");
      res.end(Buffer.concat(chunks));
    });
  });
  pr.on("error", function (err) {
    json(res, 502, { status: false, message: "Upstream error: " + err.message });
  });
  if (pData) pr.write(pData);
  pr.end();
}

function json(res, code, obj) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(obj));
}