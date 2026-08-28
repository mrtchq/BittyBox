# BittyBox Starter

Unified production server and starter kit for [bittybox.org](https://bittybox.org) — luxury private capsules for the micro-web.

## Architecture

- **Landing Page**: Responsive client UI served at `/` with luxury styling, dynamic background grid, live status, and responsive controls.
- **REST API**: JSON API endpoints under `/api` for creating, retrieving, and listing portable micro-sites / capsules.
- **Model Context Protocol (MCP)**: Agent-native Server-Sent Events (SSE) MCP server under `/mcp` enabling AI assistants to create and manage BittyBoxes.
- **Machine Discovery**: Agent handshake discovery endpoint at `/.well-known/bittybox-agent.json` and `/server-status`.

## Quick Start

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Runs the unified server with live reload via `tsx` on `http://localhost:3012`.

### Build & Production

```bash
npm run build
npm start
```

### Testing MCP Integration

```bash
node scripts/mcp-smoke.mjs
```

## API Surface

- `GET /api/health` — Health check endpoint.
- `GET /api/boxes` — List all created capsules.
- `POST /api/boxes` — Create a new portable capsule (`{ content: string, title?: string }`).
- `GET /api/boxes/:id` — Retrieve a specific capsule by ID.
- `GET /.well-known/bittybox-agent.json` — Machine-readable agent discovery manifest.
- `GET /mcp/sse` & `POST /mcp/message` — Model Context Protocol endpoint for AI agent tools.

## License

[MIT](LICENSE)
