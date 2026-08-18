# Cabana Deck

An interactive resort map for browsing and booking poolside cabanas — a REST API backend (.NET) and a React frontend, served together from one process.

![Resort map screenshot](screenshot.png)

## Quick start

**Prerequisites:** Docker (and Docker Compose, bundled with Docker Desktop / the `docker compose` CLI plugin)

```
docker compose up --build
```

Builds the frontend, publishes the backend, and serves everything — API, built frontend, map tile assets — from one container at `http://localhost:8080`. Open that URL in a browser.

By default the container reads the `map.ascii` and `bookings.json` baked into the image. To run it against different files, mount them in and pass `--map`/`--bookings` as the container command:

```
docker build -t cabana-deck .
docker run -p 8080:8080 \
  -v "$(pwd)/your-map.ascii:/app/your-map.ascii:ro" \
  -v "$(pwd)/your-bookings.json:/app/your-bookings.json:ro" \
  cabana-deck --map /app/your-map.ascii --bookings /app/your-bookings.json
```

(The same pattern works with `docker compose` — see the commented example in `docker-compose.yml`.)

## How to use it

- The map renders from the legend: `W` cabana, `p` pool, `#` path, `c` chalet, `.` empty space.
- Click a **green** cabana to book it — enter a room number and guest name, confirm. The tile flips to booked immediately — that's the confirmation, no extra step.
- Click a **terracotta** (booked) cabana to release it — enter the room number and guest name it was booked under. The map never shows *who* booked a cabana to a casual visitor; only the matching room+name (checked by the API) releases it.
- A room number + guest name only books/releases a cabana if that pair matches a real guest in `bookings.json` — there's no separate login (see Design decisions below).
- Each guest can hold one cabana at a time — release it before booking another.

## Running the tests

Tests run on the host, not in Docker — need .NET SDK 10.0+ and Node.js 22+ locally for this part.

Backend (xUnit — map parsing, booking/cancel logic, full HTTP API):

```
dotnet test backend.Tests/ResortMap.Api.Tests.csproj
```

Frontend (Vitest + React Testing Library — map rendering, book/error/cancel flows):

```
cd frontend && npm install && npm test -- --run
```

Both suites also run automatically in CI on every push/PR (`.github/workflows/ci.yml`).

## Project layout

```
backend/           ASP.NET Core Web API — map parsing, in-memory booking state, REST endpoints, static file hosting
backend.Tests/     xUnit unit + integration tests for the backend
frontend/          Vite + React + TypeScript SPA, builds into backend/wwwroot
assets/            Map tile art (provided) — served by the backend at /assets
map.ascii          Default resort map
bookings.json      Default guest roster (room number + name pairs) used to validate bookings
Dockerfile         Single entrypoint: multi-stage build (frontend → backend → runtime)
docker-compose.yml Convenience wrapper around `docker build`/`docker run`
```

## API

- `GET /api/map` → `{ width, height, grid: string[], cabanas: [{id, row, col, available}] }` — never includes who booked a cabana, only whether it's available
- `POST /api/bookings` `{ cabanaId, room, guestName }` → `200` on success, `400` if the guest isn't in the roster, `409` if the cabana is already booked *or* this guest already holds a different one, `404` if the cabana doesn't exist
- `DELETE /api/bookings/{cabanaId}` `{ room, guestName }` → `200` on success, `400` if room/name don't match the existing booking, `409` if it isn't booked

## Design decisions & trade-offs

**Single process, single origin, single container.** The backend serves the built frontend (`wwwroot`) and the map tile `assets/` folder alongside the API, so there's one command, one port, and no CORS configuration to reason about. `docker compose up --build` is the one entrypoint — no separately-running local .NET/Node toolchain needed just to use the app.

**In-memory booking state, no database.** Cabana availability lives in a dictionary seeded from the parsed map at startup and resets on restart — explicitly allowed by the brief, and the honest choice for a stateless demo instead of standing up persistence nobody asked for. `bookings.json` is a guest roster used only to *validate* a room+name pair, not a booking ledger.

**One cabana per guest at a time.** A room+name pair identifies a single guest, and a guest holding several cabanas simultaneously isn't a real scenario — booking while already holding one is rejected (`409`) with a message telling them to release it first.

**No real auth, but the client never gets to skip the check.** Per the brief, knowing a room number and guest name is treated as sufficient authorization to book *or* release a cabana. Concretely: the API is the only place that check happens — the frontend never caches or reuses a room/name pair to submit a release on the guest's behalf, and `GET /api/map` never reveals who booked a cabana. Releasing always means re-entering the room+name, exactly like booking does, so the model stays meaningful instead of becoming "whoever has the page open can cancel anyone's booking."

**A side panel instead of a modal.** Clicking a cabana swaps the content of a persistent right-hand rail rather than opening an overlay — the map is never covered, and the whole interaction (see availability → book or release → confirmation) happens without navigating away or losing your place. This was deliberately validated as a UI/UX mockup before any of it was implemented.

**Release/cancel endpoint beyond the literal spec.** The brief only asks for booking, but a booking flow without any way to undo a mistake felt incomplete, and the no-real-auth model extends naturally to it (same room+name check). Kept minimal on purpose — no admin view, no booking history.

**What was kept simple / skipped:** no pagination or filtering (the map is small enough to render whole), no optimistic UI rollback beyond a plain error message on failure, no accessibility work beyond keyboard-operable cabana tiles and semantic buttons/labels, no visual distinction for map tiles beyond the legend's four types.

## AI-assisted workflow

See [AI.md](AI.md) for how this was built with Claude Code, including the planning and design steps taken before writing code.
