# AI-assisted workflow

Built with [Claude Code](https://claude.com/claude-code) (Claude Sonnet 5).

- **Design first, via an artifact.** Before writing production code, agreed the UI/UX and backend approach together using an interactive HTML/CSS/JS mockup (a Claude Artifact) built from the real map/guest data and the actual tile assets. UX got the most attention here, since that's what the guest actually experiences — layout, states (available/yours/taken), and the booking flow were all settled before any real component existed.
- **Story-based implementation.** Used BMad's story workflow — each unit of work written up as a story file (acceptance criteria, tasks, dev notes) before being built, so implementation had a clear, checkable order and a paper trail per feature.
- **Backend split into three focused services:** `MapParser` (parses the ASCII map into a grid + cabana list), `BookingService` (in-memory booking state, guest validation, one-cabana-limit logic), and `PathResolver` (resolves `--map`/`--bookings` file paths). Each implemented and tested independently.
- **Test coverage** across backend (xUnit) and frontend (Vitest + React Testing Library) — map parsing, booking/cancel logic, the REST API, and UI flows.
- **CI pipeline** on GitHub Actions — runs both test suites on every push/PR.
- **Runs in Docker** — a multi-stage build (frontend → backend → runtime) into a single container; no local Node/.NET toolchain needed just to use the app.
