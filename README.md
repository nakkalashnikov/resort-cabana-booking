# Cabana Deck

Original task brief: [TASK_README.md](TASK_README.md). AI workflow: [AI.md](AI.md).

## Run

```
docker compose up --build
```

→ `http://localhost:8080`

Custom map/bookings:

```
docker build -t cabana-deck .
docker run -p 8080:8080 \
  -v "$(pwd)/your-map.ascii:/app/your-map.ascii:ro" \
  -v "$(pwd)/your-bookings.json:/app/your-bookings.json:ro" \
  cabana-deck --map /app/your-map.ascii --bookings /app/your-bookings.json
```

## Use

Log in with room number + guest name (validated against `bookings.json`). Map shows three states: available (green, click to book), yours (teal, click to release), taken (terracotta, no action). Max 2 cabanas per guest.

## Tests

```
dotnet test backend.Tests/ResortMap.Api.Tests.csproj
cd frontend && npm install && npm test -- --run
```

Also run in CI on every push (`.github/workflows/ci.yml`).

## API

- `GET /api/map?room=&guestName=` — grid + cabana states (`mine` flag, no other guest's identity)
- `POST /api/bookings` `{cabanaId, room, guestName}`
- `DELETE /api/bookings/{cabanaId}` `{room, guestName}`

## Design decisions

- Single container, single origin (backend serves API + built frontend + assets) — one command, no CORS.
- In-memory state, no DB — resets on restart, per spec.
- Login gate (room+name) once per session, reused for every action — no re-typing, and lets the map show "mine" vs "taken" without ever exposing other guests' identities.
- Max 2 cabanas per guest.
- Release/cancel added beyond the literal spec — same room+name check as booking, no admin view or history.
