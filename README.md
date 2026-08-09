<div align="center">

# ✉ ZERON TEMP MAIL

### Real temporary email. Live inbox in your browser. Zero signup.

[![live api](https://shieldcn.dev/badge/dynamic/json.svg?url=https%3A%2F%2Fdev-zeron-temp-gmail-api-v1.vercel.app%2Fapi%2Fhealth&query=data.status&label=live%20api&color=22C55E&size=sm)](https://dev-zeron-temp-gmail-api-v1.vercel.app/api/health)
[![stars](https://shieldcn.dev/github/stars/ZeronModz/zeron-temp-mail-brutal-template.svg)](https://github.com/ZeronModz/zeron-temp-mail-brutal-template)
[![forks](https://shieldcn.dev/github/forks/ZeronModz/zeron-temp-mail-brutal-template.svg)](https://github.com/ZeronModz/zeron-temp-mail-brutal-template)
[![license](https://shieldcn.dev/github/license/ZeronModz/zeron-temp-mail-brutal-template.svg)](https://github.com/ZeronModz/zeron-temp-mail-brutal-template)
[![code](https://shieldcn.dev/badge/zero-signup-green.svg)](https://shieldcn.dev/badge/zero-signup-green.svg)
[![design](https://shieldcn.dev/badge/design-brutalist-red.svg)](https://shieldcn.dev/badge/design-brutalist-red.svg)
[![responsive](https://shieldcn.dev/badge/all-devices-yellow.svg)](https://shieldcn.dev/badge/all-devices-yellow.svg)
[![stack](https://shieldcn.dev/badge/vanilla-js-html-black.svg)](https://shieldcn.dev/badge/vanilla-js-html-black.svg)
[![made by](https://shieldcn.dev/badge/made%20by-DevZeron-black.svg)](https://t.me/CodeDevZeron)

**Live demo:** [zeron-temp-mail-brutal-template.vercel.app](https://zeron-temp-mail-brutal-template.vercel.app)

---

</div>

A **working temp-mail web app** like temp-mail.org — not a documentation page. Visitor opens the site → a throwaway address is generated instantly → mail lands in the inbox live → read OTPs, search, delete. The brutalist design is locked in for **every screen size: phone, tablet, desktop**.

## Why this exists (the real story)

The old version in this repo was an *API documentary* — a fancy page that *described* the DevZeron Temp Gmail API endpoints. That is **not** what a normal user wants. A normal user does not have (and should never need) an API key.

This rebuild is the **actual product**: the visitor is the user, the key stays **server-side in an environment variable**, and the API is a private proxy only the server talks to.

---

## 🚀 One-Click Deploy (Vercel)

1. Click the button.
2. Import repo → add the env var → Deploy.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ZeronModz/zeron-temp-mail-brutal-template)

> Netlify: drag-drop works, but the key will NOT be server-side. Use the standalone key in CONFIG, or follow the [function setup](#-other-hosts).

### Environment variables (the ONLY thing you set)

| Variable | Required | Meaning |
|---|---|---|
| `ZERON_API_KEY` | ✅ | Your `key_xxxx` from the DevZeron Temp Gmail API |
| `ZERON_API_BASE` | ⬜ | API host override (default: `https://dev-zeron-temp-gmail-api-v1.vercel.app`) |

**Vercel dashboard:** Settings → Environment Variables → add `ZERON_API_KEY` → Save → Deploy.

That's the whole setup. **No code edit. No key in the repo. Visitors never see the key.**

---

## 📦 What's inside

| Feature | Where |
|---|---|
| Auto-generate temp address on load | Header → address card |
| Copy address (clipboard) | `COPY` button |
| New address (one click) | `⟳ NEW ADDRESS` |
| Live inbox with auto-refresh (15s, toggleable) | Inbox panel |
| Read full message (sender / to / date / body) | Reader pane / full-screen on mobile |
| Unread tracking + NEW badge + beep on new mail | per-message |
| Inbox search (`readby` endpoint) | search bar |
| Delete single message | `✕` on row / reader |
| Mark unread again | reader `UNREAD` button |
| Message count / unread count | stats band |
| API health indicator | top-right pill |
| Config drawer (API base override + standalone key) | `CONFIG` button |

## 🧱 File structure

```
├── index.html        # brutalist, mobile-first UI (zero deps)
├── app.js            # client logic (browser localStorage persistence)
└── api/
    └── index.js      # Vercel serverless proxy — injects env-var key
```

No build step. No npm. No framework.

---

## 🔌 How the proxy keeps the key secret

```
Visitor        POST /api  { "path": "generate/mixed" }
   │
   ▼
[Vercel function api/index.js]   ← reads process.env.ZERON_API_KEY
   │   Authorization: Bearer key_xxxx  (injected server-side)
   ▼
[DevZeron Temp Gmail API]        → alias / inbox JSON
   │
   ▼
Visitor sees JSON. Key never left the server.
```

### Usage (any host that runs serverless functions)

Frontend calls the proxy with a JSON body. No headers, no key:

```bash
curl -X POST https://YOUR-SITE/api \
  -H "Content-Type: application/json" \
  -d '{"path":"generate/mixed"}'
```

```bash
curl -X POST https://YOUR-SITE/api \
  -H "Content-Type: application/json" \
  -d '{"path":"read/zeronmodz+alias@gmail.com","query":{"limit":"25"}}'
```

## 🔑 Get a key (if you don't have one)

The API registers via your own Gmail + App Password:

```
POST /api/register   { "email": "you@gmail.com", "pass": "abcd efgh ijkl mnop" }
→ { "key": "key_xxxx..." }
```

Then put that `key_xxx` in `ZERON_API_KEY`. (More in [the API docs](https://dev-zeron-temp-gmail-api-v1.vercel.app/).)

---

## 📖 API reference (everything the proxy forwards)

Auth header: `Authorization: Bearer <key>` (added by the proxy automatically)

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

> ⚠️ Path emails must use a **plain `@`** — encoding it as `%40` makes the API reject the address.

---

## ⚡ Standalone / static hosts (no function endpoint)

If you host the files as pure static (GitHub Pages, Cloudflare, S3):

1. Open the site → **CONFIG** button.
2. Paste your `key_xxxx` in **STANDALONE KEY** + Save.
3. Requests fall back to the real API directly from the browser.

Fine for personal use. For public sites prefer the Vercel proxy (key stays server-side).

---

## 🎨 Design system (brutalist, mobile-first)

- **Palette:** paper `#F2EDE4` · ink `#0b0b0b` · red `#FF2A00` · yellow `#FFD60A` · green `#12B84A`
- **Type:** Archivo Black (display) + Inter (body) + JetBrains Mono (meta)
- **Rules:** zero `border-radius`, 3px borders, hard offset shadows, 80–150ms snappy motion, `prefers-reduced-motion` respected
- **Responsive:** stats collapse 4→2, inbox splits to list→reader overlay on <880px, full-width tap targets (44px+)

---

## ✅ Disclaimer

The registered Gmail + App Password belong to the site owner. Aliases are dot/plus variants of that inbox — **the deployer must use their own Gmail + app password when registering** their key. Don't ship a key you don't own.

---

<div align="center">

Made with 🖤 by [@DevZeron](https://t.me/CodeDevZeron) · API: DevZeron Temp Gmail v2 · Year: 2026

</div>