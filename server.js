/* ==================================================================
   ZERON TEMP MAIL — standalone Node server (zero dependencies)
   ------------------------------------------------------------------
   Runs the WHOLE app (static files + /api proxy) from one process.
   Deploy on: Render, Railway, Heroku, Fly.io, Koyeb, Glitch, Replit,
   or any VPS with Node >= 14 installed.

     npm start            # or: node server.js

   Env vars:
     ZERON_API_KEY  required        key_xxxx
     ZERON_API_BASE optional        upstream host default
     PORT           optional        default 3000

   If you don't want env vars you can put apiKey/apiBase in config.json
   (copy from config.example.json).
   ================================================================== */

var http = require("http");
var fs = require("fs");
var path = require("path");
var proxy = require("./proxy.js");

var ROOT = __dirname;
var PORT = process.env.PORT || process.env.PORT_NUMBER || 3000;

/* Optional file-based config for hosts with no env-var dashboard:
   cp config.example.json config.json  (config.json is gitignored).
   Env vars still win — only applied when nothing is set yet. */
try {
  var fileCfg = JSON.parse(fs.readFileSync(path.join(ROOT, "config.json"), "utf-8"));
  if (fileCfg && !process.env.ZERON_API_KEY && fileCfg.apiKey) process.env.ZERON_API_KEY = String(fileCfg.apiKey);
  if (fileCfg && !process.env.ZERON_API_BASE && fileCfg.apiBase) process.env.ZERON_API_BASE = String(fileCfg.apiBase);
} catch (e) { /* no config.json — env vars only */ }

var MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8"
};

/* Only these files are ever public. config.json / proxy.js / adapters
   are NEVER served (that would leak the server-side key). */
function publicFile(urlPath) {
  var p = String(urlPath).split("?")[0].replace(/\/+$/, "") || "/";
  if (p === "/" || p === "/index.html") return "index.html";
  if (p === "/app.js") return "app.js";
  if (p === "/favicon.ico") return "favicon.ico";
  if (/\.(css|svg|png|jpe?g|gif|txt|webmanifest)$/i.test(p)) return p.replace(/^\/+/, "");
  return null;
}

function serveStatic(req, res) {
  var rel = publicFile(req.url);
  if (!rel) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("404 — not found");
    return;
  }
  var file = path.join(ROOT, rel);
  fs.readFile(file, function (err, buf) {
    if (err) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("404 — not found");
      return;
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", MIME[path.extname(file)] || "application/octet-stream");
    res.setHeader("Cache-Control", rel === "index.html" ? "no-cache" : "public, max-age=3600");
    res.end(buf);
  });
}

function apiHandler(req, res) {
  var chunks = [];
  req.on("data", function (c) { chunks.push(c); });
  req.on("end", function () {
    var raw = Buffer.concat(chunks).toString("utf-8");
    req.body = raw;
    proxy.expressHandler(req, res);
  });
  req.on("error", function () {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ status: false, message: "Bad request" }));
  });
}

var server = http.createServer(function (req, res) {
  if (req.method === "POST" && req.url.split("?")[0] === "/api") return apiHandler(req, res);
  if (req.method === "OPTIONS") return proxy.expressHandler(req, res);
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET, HEAD, POST, OPTIONS");
    res.end("405 — method not allowed");
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, function () {
  console.log("ZERON TEMP MAIL running at http://localhost:" + PORT);
  console.log("Proxy: POST /api"); 
});