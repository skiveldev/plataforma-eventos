# AgendaU

AgendaU is an individual university project for discovering and managing academic events. It provides a React 19 single-page client and an Express 5 REST API backed by a local JSON file, organized as npm workspaces.

## Requirements

- Node.js 20 or newer
- npm 10 or newer

## Quick Start

```bash
npm install
npm run dev:backend   # → http://localhost:3001
npm run dev:frontend  # → http://localhost:5173
```

The API serves the REST endpoints; the frontend proxies API calls via Vite.

## Verification

```bash
npm test              # vitest (frontend: 13 tests, backend: 12 tests) — all must pass
npm run build         # Vite production build + backend syntax check
```

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, Vitest + Testing Library |
| Backend | Express 5, custom validation, supertest |
| Persistence | JSON file with serialized read-modify-write |
| Tooling | npm workspaces, no TypeScript/linter configured |

## Structure

```
backend/
├── src/
│   ├── app.js            # Express app + routes
│   ├── server.js         # Entry point (port 3001)
│   ├── services/         # Domain logic
│   ├── repository/       # JSON file read/write
│   ├── validation.js     # Zod schemas
│   └── data/             # db.json store
└── test/
    ├── app.test.js       # 11 integration tests (supertest)
    └── jsonRepository.test.js  # 1 unit test

frontend/
├── src/
│   ├── App.jsx           # Main page: event grid + form
│   ├── EventForm.jsx     # Reusable prop-injected form
│   ├── main.jsx          # React DOM entry
│   ├── api/              # Fetch adapters
│   ├── styles.css        # Responsive styles
│   └── test/setup.js     # jsdom + Testing Library
└── App.test.jsx          # 13 integration tests

docs/                     # Coursework deliverables (Spanish)
```

The JSON store is appropriate for coursework and local development, but it is not intended for concurrent production writes.
