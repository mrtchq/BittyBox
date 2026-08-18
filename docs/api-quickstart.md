# Bitty Box — API Quickstart

A fast, copy-paste path to creating and reading self-contained, shareable
URL fragments (HTML, markdown, code, recipes, apps) through the Bitty Box REST API.

> Base URL: replace `<BASE_URL>` with your deployment. The server runs on
> port `3012` by default (`PORT` env), so locally it is `http://localhost:3012`.
> All endpoints return JSON and set permissive CORS headers.

---

## 1. Health check

```bash
curl <BASE_URL>/api/health
```

```json
{ "status": "ok", "service": "bittybox", "version": "2.0.0",
  "app": "original-itty-bitty-engine", "mcpEndpoint": "/mcp",
  "timestamp": "2026-08-18T00:00:00.000Z" }
```

---

## 2. Authentication (optional)

Most endpoints work unauthenticated, but authenticated calls are attributed to
your account and recorded in your link history. Get a key once, then send it on
every request.

**Create an API key** (the full secret is shown only this once):

```bash
curl -X POST <BASE_URL>/api/accounts/keys \
  -H 'Content-Type: application/json' \
  -d '{"label":"my-cli","scopes":["links:create","links:read","mcp:access"]}'
```

```json
{ "success": true,
  "key": { "keyId": "ak_...", "rawKey": "bb_live_xxxxxxxxxxxxxxxxxxxx",
           "prefix": "bb_live_xxxxxxxx...", "scopes": ["links:create","links:read","mcp:access"] } }
```

**Send the key** on subsequent calls via either header:

```bash
Authorization: Bearer bb_live_xxxxxxxxxxxxxxxxxxxx
# or
X-API-Key: bb_live_xxxxxxxxxxxxxxxxxxxx
```

**Inspect / test a key:**

```bash
curl -X POST <BASE_URL>/api/accounts/keys/test \
  -H 'Content-Type: application/json' -d '{"key":"bb_live_xxxxxxxxxxxxxxxxxxxx"}'
```

**Switch identity (no password, email-keyed):**

```bash
curl -X POST <BASE_URL>/api/accounts/login \
  -H 'Content-Type: application/json' -d '{"email":"you@example.com","displayName":"You"}'
```

**Current account:**

```bash
curl <BASE_URL>/api/accounts/me -H 'Authorization: Bearer bb_live_xxx'
```

---

## 3. Create a Bitty link

`POST /api/bitty/create` (also aliased at `POST /api/bitty`).

### Minimum viable call

```bash
curl -X POST <BASE_URL>/api/bitty/create \
  -H 'Content-Type: application/json' \
  -d '{"content":"<h1>Hello Bitty</h1>","format":"html","title":"Greeting"}'
```

### Field reference

| Field        | Type    | Notes |
|--------------|---------|-------|
| `content`    | string  | Raw payload. Alternative single-field shortcuts: `code`, `markdown`, `html`. |
| `title`      | string  | Human label (returned, not required). |
| `format`     | string  | `auto` (default), `markdown`, `code`, `html`, `json`, `svg`, `canvas`, `recipe`, `text`. |
| `language`   | string  | For `code` format (e.g. `python`, `js`). |
| `theme`      | string  | Viewer theme hint. |
| `editable`   | boolean | Whether viewers may re-edit. |
| `password`   | string  | If set, payload is encrypted with **AES-256-GCM** and `isEncrypted: true`. |
| `domain`     | string  | Optional domain binding. |
| `metadata`   | object  | Arbitrary JSON attached to the link record. |

### GET shortcut (for browser/testing)

```bash
curl "<BASE_URL>/api/bitty/create?content=<h1>Hi</h1>&format=html&redirect=1"
```

`redirect=1` issues a 302 straight to the generated link instead of JSON.

### Example response

```json
{
  "success": true,
  "url": "https://bittybox.org/#<encoded-payload>",
  "title": "Greeting",
  "format": "html",
  "isEncrypted": false,
  "stats": {
    "rawBytes": 22, "renderedBytes": 22, "compressedBytes": 41,
    "urlLength": 71, "compressionRatio": 0.53
  },
  "qrCodeUrl": "https://bittybox.org/api/bitty/qr/...",
  "markdownLink": "[Greeting](https://bittybox.org/#...)",
  "iframeSnippet": "<iframe src=\"https://bittybox.org/#...\" ...></iframe>"
}
```

The `url` is the shareable fragment. `iframeSnippet` and `markdownLink` are
ready-to-paste embeds.

---

## 4. Decode / read a link

`POST /api/bitty/decode`

```bash
curl -X POST <BASE_URL>/api/bitty/decode \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://bittybox.org/#<encoded-payload>","password":"optional"}'
```

Returns the decoded payload and metadata. Required when the link was created
with a `password`.

---

## 5. List supported formats

```bash
curl <BASE_URL>/api/bitty/formats
```

Returns the format table (`auto`, `markdown`, `code`, `html`, `json`, `svg`,
`canvas`, `recipe`, `text`) plus feature flags (GZIP-9, AES-256-GCM, MCP
servers, API-key auth).

---

## 6. Interactive docs & MCP

- **Interactive API reference:** `GET <BASE_URL>/api/docs` (HTML page).
- **Model Context Protocol (Streamable HTTP):** `POST <BASE_URL>/mcp`
  (also `POST <BASE_URL>/api/mcp`). Use this to let an AI agent create and
  decode links on your behalf.

---

## 7. Ten-second example

```bash
# 1. mint a key
KEY=$(curl -s -X POST <BASE_URL>/api/accounts/keys -H 'Content-Type: application/json' \
  -d '{"label":"quickstart"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["key"]["rawKey"])')

# 2. create an encrypted link
curl -s -X POST <BASE_URL>/api/bitty/create \
  -H "Authorization: Bearer $KEY" -H 'Content-Type: application/json' \
  -d '{"content":"secret note","format":"text","password":"hunter2"}'
```

That's the whole loop: **create → (optionally gate with a password) → share → decode**.
