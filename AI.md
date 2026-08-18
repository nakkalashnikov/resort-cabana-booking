# AI-assisted workflow

Built with [Claude Code](https://claude.com/claude-code) (Claude Sonnet 5), working directly in this repository from an empty starting point (just `README.md`, `map.ascii`, `bookings.json`, `assets/`).

## Roughly how it went

1. **Understanding the brief.** Asked Claude to explain the task (in Ukrainian) before any code — legend, API/frontend split, deliverables, what "no persistence / no auth" actually meant in practice.
2. **Planning.** Used Claude Code's plan mode to design the architecture before writing anything: single ASP.NET Core process serving both the API and the built React SPA (avoids CORS/two-process complexity), in-memory `BookingService`, the `GET /api/map` / `POST /api/bookings` contract, project layout, and a test strategy. The plan was reviewed and approved before implementation started.
3. **Design pass as an artifact.** Before touching the real UI, asked Claude to build an interactive HTML/CSS/JS mockup (published as a Claude Artifact) of the map + booking side panel, using the real map/guest data and the actual tile PNGs from `assets/`. Iterated on it directly: palette (complementary teal/terracotta), typography, no-modal side-rail interaction model, day/night theming tied to the real clock instead of OS dark-mode, mobile responsiveness. This mockup became the source of truth the real frontend was built against — it caught the whole interaction model (and one real bug: `pool.png` turned out to be a single icon, not a tileable water texture, only discovered once it was actually rendered full-size in the real app) before any production code existed.
4. **Story breakdown.** Split the approved plan into small, sequential story files (`.claude/stories/`, gitignored — working notes, not a deliverable) covering backend domain logic, API + static hosting, backend tests, frontend scaffold + map rendering, booking panel, frontend tests, and the entrypoint/docs — each with acceptance criteria and dev notes, so implementation had a clear, checkable order (backend fully working and tested before the frontend started consuming it).
5. **Implementation**, one story at a time, directly in the main session — **no subagents**, by explicit request, since re-deriving context in a fresh subagent costs more tokens than it saves at this project's scope. Each story was built, manually verified (curl for the API, `dotnet test`/`npm test`, and Playwright screenshots against the actually-running app — not just the design mockup), committed, and pushed before moving to the next.
6. **Wrap-up.** CI (GitHub Actions), `run.sh`, this README, and the screenshot were done last, once everything else was green.

## Notable corrections along the way

- Asked to slow down mid-scaffold and not write code before a design discussion was finished — respected, work paused until the user explicitly said to proceed.
- Asked for git commits to use the user's own email rather than the auto-detected one; fixed per-commit via `--author` (global git config is intentionally never touched by the agent).
- Asked to reconsider theme switching: tied to the guest's actual local clock (sunrise/sunset) rather than the OS's dark-mode preference, since a resort map should look like the actual time of day.
- Asked whether to add a full CI/CD pipeline and a live deployment (a home server via Cloudflare Tunnel) to "show off" production practices for a job application. Landed on: add CI (cheap, standard, clearly signals engineering maturity) but skip a live public deployment, since the brief explicitly asks to keep the submission simple and a permanently-running personal server is a different kind of commitment than a take-home test warrants.

## Notes for reviewers

Nothing in this repo is hand-written boilerplate copy-pasted without reading it — architecture, API contract, and UI decisions were made deliberately and can be discussed in detail, including why (e.g. why a side panel instead of a modal, why cabana state isn't persisted, why the cancel endpoint exists beyond the literal spec).
