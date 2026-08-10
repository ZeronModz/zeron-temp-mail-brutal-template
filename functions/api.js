/**
 * ZERON TEMP MAIL — Cloudflare Pages Functions adapter (self-contained)
 * ---------------------------------------------------------------------
 * Runs on the workerd runtime, so this file imports nothing (no node
 * built-ins, no shared core). It only uses global fetch + context.env.
 * Cloudflare Pages auto-routes every /api request here when this file
 * sits at functions/api.js.
 *
 * Env vars (Pages dashboard → Settings → Environment variables):
 *   ZERON_API_KEY = key_xxxx     (required)
 *   ZERON_API_BASE               (optional)
 */
export async function onRequest(context) {
  var DEFAULT_BASE = "https://dev-zeron-temp-gmail-api-v1.vercel.app";
  var CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "X-Content-Type-Options": "nosniff"
  };

  var body = {};
  try { body = await context.request.json(); } catch (e) { /* empty body */ }

  var key = context.env.ZERON_API_KEY || "";
  var base = (context.env.ZERON_API_BASE || DEFAULT_BASE).replace(/\/+$/, "");
  var method = String(body.method || "GET").toUpperCase();
  var path = String(body.path || "").replace(/^\/+|\/+$/g, "");

  if (!path) {
    return json(400, { status: false, message: 'Missing "path", e.g. { "path": "generate/mixed" }' }, CORS);
  }
  if (!key) {
    return json(500, { status: false, message: "No API key configured. Add ZERON_API_KEY in Pages → Settings → Environment variables." }, CORS);
  }

  var qs = "";
  if (body.query && typeof body.query === "object") {
    var p = new URLSearchParams();
    Object.keys(body.query).forEach(function (k) {
      var v = body.query[k];
      if (v !== undefined && v !== null && String(v) !== "") p.append(k, String(v));
    });
    qs = p.toString() ? "?" + p.toString() : "";
  }

  var target = base + "/api/" + path + qs;
  var init = { method: method, headers: { "Authorization": "Bearer " + key, "Accept": "application/json" } };
  if (method === "POST" && body.data) {
    init.body = JSON.stringify(body.data);
    init.headers["Content-Type"] = "application/json";
  }

  try {
    var up = await fetch(target, init);
    var text = await up.text();
    var headers = Object.assign({}, CORS, { "Content-Type": up.headers.get("content-type") || "application/json" });
    return new Response(text, { status: up.status, headers: headers });
  } catch (err) {
    return json(502, { status: false, message: "Upstream error: " + err.message }, CORS);
  }
}

function json(status, obj, cors) {
  return new Response(JSON.stringify(obj), { status: status, headers: Object.assign({}, cors, { "Content-Type": "application/json" }) });
}