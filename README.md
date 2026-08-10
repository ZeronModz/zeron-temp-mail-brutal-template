<div align="center">

# ✉ ZERON TEMP MAIL

### Real temporary email. Live inbox in your browser. Zero signup. **Deploys anywhere.**

[![live api](https://shieldcn.dev/badge/dynamic/json.svg?url=https%3A%2F%2Fdev-zeron-temp-gmail-api-v1.vercel.app%2Fapi%2Fhealth&query=data.status&label=live%20api&color=22C55E&size=sm)](https://dev-zeron-temp-gmail-api-v1.vercel.app/api/health)
[![stars](https://shieldcn.dev/github/stars/ZeronModz/zeron-temp-mail-brutal-template.svg)](https://github.com/ZeronModz/zeron-temp-mail-brutal-template)
[![forks](https://shieldcn.dev/github/forks/ZeronModz/zeron-temp-mail-brutal-template.svg)](https://github.com/ZeronModz/zeron-temp-mail-brutal-template)
[![license](https://shieldcn.dev/github/license/ZeronModz/zeron-temp-mail-brutal-template.svg)](https://github.com/ZeronModz/zeron-temp-mail-brutal-template)
[![zero-dep](https://shieldcn.dev/badge/zero-dependencies-green.svg)](https://shieldcn.dev/badge/zero-dependencies-green.svg)
[![design](https://shieldcn.dev/badge/design-brutalist-red.svg)](https://shieldcn.dev/badge/design-brutalist-red.svg)
[![responsive](https://shieldcn.dev/badge/all-devices-yellow.svg)](https://shieldcn.dev/badge/all-devices-yellow.svg)
[![made by](https://shieldcn.dev/badge/made%20by-DevZeron-black.svg)](https://t.me/CodeDevZeron)

**Live demo:** [zeron-temp-mail-brutal-template.vercel.app](https://zeron-temp-mail-brutal-template.vercel.app)

---

</div>

A **working temp-mail web app** like temp-mail.org — not a documentation page. Visitor opens the site → a throwaway address is generated instantly → mail lands in the inbox live → read OTPs, search, delete. Brutalist, **mobile-first**, every screen size locked.

The app has **no secrets and no vendored backend**. There is exactly one *owned* API (the DevZeron Temp Gmail API) and a **thin proxy** that keeps your personal key server-side. The proxy is provided in **every hosting shape** so you can put this on whatever domain/platform you own.

---

## 🌍 Deploy matrix — pick your host

| Host / platform | How | Key location |
|---|---|---|
| **Vercel** | one-click / `api/index.js` auto-deploy | env `ZERON_API_KEY` |
| **Netlify** | `netlify/functions` auto-detected + `_redirects` | env `ZERON_API_KEY` |
| **Cloudflare Pages** | `functions/api.js` auto-routed | env `ZERON_API_KEY` |
| **Render · Railway · Heroku · Fly.io · Koyeb · Glitch · Replit · any VPS** | `node server.js` | env `ZERON_API_KEY` **or** `config.json` |
| **Docker host** (Render/Railway/K8s/any) | `Dockerfile` | env or `config.json` |
| **Shared hosting / cPanel / Hostinger** (PHP) | drop repo in `public_html`, `api.php` handles it | `$API_KEY` at top of `api.php` or env |
| **Pure static** (GitHub Pages, Cloudflare, S3) | drag-drop files | browser-side **CONFIG → STANDALONE KEY** |

Frontend **auto-detects** the proxy: it tries `POST /api` → `POST /api.php` → falls back to direct API with your standalone key. Same `index.html` + `app.js` on every host. Zero code edits.

| Option | How the key enters |
|---|---|
| Env var | `ZERON_API_KEY` every server host |
| File | `config.json` (`cp config.example.json config.json` + fill `apiKey`) |
| Hardcode | edit `api.php` `$API_KEY`, or `app.js` `TEMPLATE_CONFIG.API_KEY` for static-only |

---

## 🚀 One-click deploys

<a href="https://vercel.com/new/clone?repository-url=https://github.com/ZeronModz/zeron-temp-mail-brutal-template">
<img src="https://vercel.com/button" alt="Deploy to Vercel" height="34" /></a>
<a href="https://app.netlify.com/start/deploy?repository=https://github.com/ZeronModz/zeron-temp-mail-brutal-template">
<img src="https://www.netlify.com/img/deploy/button.svg" alt="Deploy to Netlify" height="34" /></a>
<a href="https://render.com/deploy?repo=https://github.com/ZeronModz/zeron-temp-mail-brutal-template">
<img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render" height="34" /></a>
<a href="https://railway.app/template"><img src="https://railway.app/button.svg" alt="Deploy on Railway" height="34" /></a>

---

## 🔑 Get a key first (only once)

The API registers via any Gmail + App Password:

```bash
curl -X POST https://dev-zeron-temp-gmail-api-v1.vercel.app/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@gmail.com","pass":"abcd efgh ijkl mnop"}'
# → { "key": "key_xxxx..." }
```

Put that `key_xxxx` into the env var (or `config.json` / `api.php $API_KEY`). Use your **own** Gmail — aliases are dot/plus variants of that inbox.

---

## 📦 What's inside

| Feature | Where |
|---|---|
| Auto-generate temp address on load | header address card |
| Copy / new address (one click) | `COPY` · `⟳ NEW ADDRESS` |
| Live inbox, auto-refresh 15s (toggleable) | inbox panel |
| Read full message (sender / to / date / body) | reader pane / overlay on mobile |
| Unread tracking + NEW badge + beep | per-message |
| Inbox search (`readby` endpoint) | search bar |
| Delete single message / mark unread | `✕` / reader `UNREAD` |
| Stats band (total / unread) | list footer |
| API health indicator | top-right pill |
| Config drawer (API base override + standalone key) | `CONFIG` button |

## 🧱 File structure

```
├── index.html               # brutalist mobile-first UI (zero deps)
├── app.js                   # client — auto-detects proxy, all devices
├── proxy.js                 # ★ universal proxy CORE (key stays server-side)
├── server.js                # standalone Node server (Render/VPS/etc.) + static files
├── api/index.js             # Vercel adapter            (POST /api)
├── netlify/functions/api.js # Netlify adapter           (POST /api via _redirects)
├── functions/api.js         # Cloudflare Pages adapter  (POST /api)
├── api.php                  # cPanel/shared-host proxy  (POST /api.php)
├── config.example.json      # optional file-based key (→ config.json, gitignored)
├── package.json             # `npm start` → runs server.js (no deps)
├── Dockerfile               # any Docker host
└── _redirects / netlify.toml
```

No build step. No framework. No `npm install`. Zero runtime dependencies.

---

## 🔌 How the proxy hides the key

```
Visitor        POST /api (or /api.php)  { "path": "generate/mixed" }
   │
   ▼
[proxy core (server-side)]    ← env var / config.php / app
   │   Authorization: Bearer key_xxxx   (injected here, never in the browser)
   ▼
[DevZeron Temp Gmail API]     → alias / inbox JSON
   │
   ▼
Visitor sees JSON. Key never left the server.
```

On **pure static hosts** there is no server, so the browser talks to the API directly with the key you entered in **CONFIG** (fine for personal use; for public sites use any of the server routes above).

---

## ⚙️ Configure by platform

**Vercel** — Settings → Environment Variables → `ZERON_API_KEY` → Save → Deploy.

**Netlify** — Site settings → Environment Variables → `ZERON_API_KEY`. The `netlify/functions` folder + `_redirects`/`netlify.toml` are auto-detected; `POST /api` is rewritten to the function.

**Cloudflare Pages** — connect repo → the `functions/` folder is auto-deployed. Add `ZERON_API_KEY` in Pages → Settings → Environment variables (serverless runtime reads `context.env`).

**Render / Railway / Heroku / Fly / any VPS** — start command `node server.js` (Render auto-detects `package.json` → `start`); port from `PORT`. Add `ZERON_API_KEY` env var, **or** drop a `config.json` next to `server.js`:

```json
{ "apiKey": "key_xxxx", "apiBase": "https://dev-zeron-temp-gmail-api-v1.vercel.app" }
```

**Docker** — `docker build -t zmail . && docker run -e ZERON_API_KEY=key_xxxx -p 3000:3000 zmail`.

**Shared hosting / cPanel (Hostinger, Namecheap, etc.)** — upload the repo to `public_html`. The frontend automatically calls `POST /api.php`. Edit the `$API_KEY` line at the top of `api.php` (or set env `ZERON_API_KEY` if your panel supports it). PHP 7+ with curl (or `allow_url_fopen`) — nothing else to install.

**Static (GitHub Pages, S3 …)** — publish `index.html` + `app.js`. Every request goes straight to the API from the browser using the key you save in **CONFIG → STANDALONE KEY**.

| Variable | Required | Meaning |
|---|---|---|
| `ZERON_API_KEY` | ✅ | your `key_xxxx` |
| `ZERON_API_BASE` | ⬜ | API host override |
| `PORT` | ⬜ | server.js port (default 3000) |

---

## 📖 API reference (the proxy forwards it)

Auth header `Authorization: Bearer <key>` is added by the proxy automatically.

| Group | Endpoint | Note |
|---|---|---|
| auth | `POST /api/register` | email + app password → permanent key |
| auth | `GET /api/key` | key → gmail info |
| auth | `GET /api/revoke` | delete key + data |
| generate | `GET /api/generate/{dot\|plus\|mixed}` | random alias |
| generate | `GET /api/generate/custom/<tag>` | `you+tag@gmail.com` |
| generate | `GET /api/generate/batch/<count>?type=` | 1–25 aliases |
| read | `GET /api/read/<email>?limit=` | inbox (newest first) |
| read | `GET /api/readby/<email>/<text>` | full-text search |
| read | `GET /api/unread/<email>?limit=` | unread only |
| read | `GET /api/count/<email>` | total + unread |
| manage | `GET /api/delete/<uid>` | trash |
| manage | `GET /api/markread/<uid>` / `markunread/<uid>` | flags |
| system | `GET /api/health` / `GET /api/info` | public |

Client → proxy call (no key in the browser):

```bash
curl -X POST https://YOUR-SITE/api \
  -H "Content-Type: application/json" \
  -d '{"path":"read/you+alias@gmail.com","query":{"limit":"25"}}'
```

> ⚠️ Emails in paths keep a plain `@` — encoding it as `%40` makes the API reject the address.

---

## 🎨 Design system (brutalist, mobile-first)

- **Palette:** paper `#F2EDE4` · ink `#0b0b0b` · red `#FF2A00` · yellow `#FFD60A` · green `#12B84A`
- **Type:** Archivo Black (display) + Inter (body) + JetBrains Mono (meta)
- **Rules:** zero `border-radius`, 3px borders, hard offset shadows, 80–150ms snap motion, `prefers-reduced-motion` respected
- **Responsive:** stats collapse 4→2, list→reader overlay under 880px, 44px+ tap targets

---

## ✅ Disclaimer

Use **your own** Gmail + App Password when registering a key. Aliases are dot/plus variants of that inbox — never ship a key you don't own.

---

<div align="center">

Made with 🖤 by [@DevZeron](https://t.me/CodeDevZeron) · API: DevZeron Temp Gmail v2 · Year: 2026

</div>