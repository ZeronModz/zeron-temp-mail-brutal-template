# ZERON TEMP MAIL — Brutalist Website Template

Year: 2026 · Design: Neo-Brutalism (tactile brutalism) · Powered by the **DevZeron Temp Gmail API v2** (key-based, Firebase-backed).

Single-file frontend template. Kono server / build system dorkar nei — folder ta je kono static host e drop kore deploy.

## Quick Start (user: shudhu API key change korlei publish)

**Option A — CONFIG button (no code):**
1. Website khule opor-dane **CONFIG** button e click korun.
2. `API Key` box e nijer `key_xxxx` paste kore **SAVE CONFIG** chapon korun. (Browser `localStorage` e save thakbe.)
3. Deploy kore day — done.

**Option B — code edit (recommended for "nikashkorbo" use):**
1. `app.js` khulun. Sura theke `TEMPLATE_CONFIG` object ta khejaben:
   ```js
   var TEMPLATE_CONFIG = {
     API_BASE: "https://dev-zeron-temp-gmail-api-v1.vercel.app",
     API_KEY: ""   // <-- apnar key likhe din, e.g. "key_1A2b..."
   };
   ```
2. `API_KEY` e apnar permanently key likhe Save korun. (Khali rakhte chaile end-user CONFIG panel e set korte parbe.)
3. Deploy:

| Host | Kivabe |
|---|---|
| **Vercel** | vercel.com → New Project → folder drag-drop/import → Deploy |
| **Netlify** | app.netlify.com → Sites → Add new → drag-drop folder |
| **GitHub Pages** | folder ta repo e push → Settings → Pages → main branch |
| **Cloudflare Pages** | Dashboard → Pages → Create → connect repo |

## Anti-key chai nai? (New key)

Website er **GET YOUR KEY** section e nijer Gmail + 16-char App Password diye register korun — live `/api/register` chole, key auto-save hoy. Steps: Google → 2-Step Verification ON → myaccount.google.com/apppasswords → new App Password.

## API Ref (sob ek template er bhitor e ache)

Auth: `Authorization: Bearer key_xxxx` (alt: `X-API-Key`)

| Group | Endpoint | Note |
|---|---|---|
| auth | `POST /api/register` | email + pass → permanent key |
| auth | `GET /api/key` | key info (gmail, created) |
| auth | `GET /api/revoke` | delete key + data |
| generate | `/api/generate/{dot\|plus\|mixed}` | random alias |
| generate | `/api/generate/custom/<tag>` | you+tag@gmail.com |
| generate | `/api/generate/batch/<count>?type=` | up to 25 |
| read | `/api/read/<email>?limit=` | inbox + `unread=1` |
| read | `/api/readby/<email>/<text>` | text search |
| read | `/api/unread/<email>` | unread only |
| read | `/api/count/<email>` | total + unread |
| manage | `/api/delete/<uid>` | trash |
| manage | `/api/markread/<uid>` / `/api/markunread/<uid>` | flags |
| system | `/api/health` `/api/info` | public, no key |

## Site Features

- **Live playground** — pick endpoint → auto param inputs → real request (key header inclusive) → highlighted JSON + status + timing + copy.
- **Endpoint matrix** — sob 15 endpoint group-bakhano (auth/generate/read/manage/system), click → playground e load.
- **Register panel** — live key issue.
- **Health check** — `/api/health` poll, hero e online/offline dot.
- **Config drawer** — API_BASE + API_KEY UI, localStorage persisted.
- Response format sample, HTTP status table, security section, FAQ accordion.

## Files

- `index.html` — puro site (HTML + CSS)
- `app.js` — logic + **TEMPLATE_CONFIG** (pubir bashoi ei file e key diye deo)

## Credit

API by **@DevZeron** · Channel: **t.me/CodeDevZeron** · Vercel + Firebase, free tier.