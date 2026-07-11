# Exploration: AgendaU University Deliverables Completion

> SDD phase: explore
> Change name: `university-deliverables-completion`
> Artifact store: hybrid (OpenSpec + Engram)
> Delivery strategy: force-chained (chain strategy NOT yet selected — see Unresolved Decisions)
> Review budget: 400 lines
> Language domain: English (technical artifact per SDD Language Domain Contract)

## Goal of this Exploration

Incorporate the existing, working AgendaU baseline into a formal SDD change WITHOUT rebuilding it. Identify and specify ONLY the remaining work plus any evidence/quality gaps relative to the university deliverable checklist. This artifact is exploratory only — no proposal, spec, design, or tasks are produced here.

## Current State (Implemented Baseline — verified, DO NOT rebuild)

The following are already implemented and GREEN. They are the baseline, out of scope for new work; only documentation/evidence of them is in scope.

### Stack & tooling (verified)
- npm workspaces: `frontend` (React 19.1 + Vite 7) and `backend` (Express 5.1 + Node.js, ESM).
- Test runner: `vitest` 3.2 in both workspaces. Integration: `supertest` (backend), `@testing-library/react` (frontend). No E2E.
- No TypeScript, no linter, no formatter, no type checker, no CI configured.
- JSON file persistence (`backend/src/data/db.json`) via a serialized Promise-chain repository (`createJsonRepository`) that serializes concurrent read-modify-write updates.

### Backend (`backend/src/`)
- `server.js`: wires repository + service + app, listens on `PORT` (default 3001), reads `DATA_FILE` and `CORS_ORIGIN` from env.
- `app.js`: CORS (origin `http://localhost:5173`), JSON parsing, central error handler mapping `ValidationError → 400`, `NotFoundError → 404`, `ConflictError → 409`, entity-parse → 400, fallback 404 + 500.
- REST routes implemented:
  - `GET  /api/health` → `{ status: 'ok' }`
  - `GET  /api/events?search=` (filters by title/description/category/location, case-insensitive)
  - `GET  /api/events/:id`
  - `POST /api/events` (201, validates fields)
  - `PUT  /api/events/:id` (blocks capacity below current registration count)
  - `DELETE /api/events/:id` (204, cascades registrations)
  - `GET  /api/participants`
  - `POST /api/participants` (201, unique email)
  - `POST /api/events/:id/registrations` (201, requires `participantId`, checks existence, duplicate, capacity)
  - `GET  /api/events/:id/attendees`
- `validation.js`: `requireFields`, `validateEvent`, `validateParticipant` (RFC-style email regex).
- `services/agendaService.js`: domain rules (search filter, capacity vs registration count, email uniqueness, duplicate registration, capacity reached).
- `repository/jsonRepository.js`: serialized Promise-chain `update()` to prevent concurrent-write corruption.

### Frontend (`frontend/src/`)
- `App.jsx`: single-page UI. Event list, search (debounced 250ms), loading/empty/error states, create/edit/delete flow, success/error notices, confirm-delete hook.
  - Prop-injected `loadEvents`, `addEvent`, `editEvent`, `removeEvent`, `confirmDelete` for testability.
  - Race-condition guard via `mutationRevision` ref so an older list response cannot overwrite a just-saved mutation (covered by dedicated tests).
  - Controls are disabled during submit so a second edit cannot replace the active selection.
- `EventForm.jsx`: reusable form component, create vs edit mode (keyed by `editing?.id`), client-side validation (required, valid date, positive integer capacity), `aria-invalid` + `aria-describedby` for accessibility.
- `api/eventsApi.js`: fetch-based CRUD (`getEvents`, `createEvent`, `updateEvent`, `deleteEvent`), `VITE_API_URL` override, surfaces API error messages.
- `styles.css`: custom responsive design (DM Sans + Space Grotesk), event grid, hero, form grid, notices, accessible focus/error states.
- `test/setup.js`: jest-dom matchers + per-test cleanup.

### Test status (verified by re-running `npm test` in this session)
- Frontend: **13/13 passing** in `App.test.jsx`
- Backend: **12/12 passing** (11 in `app.test.js` + 1 in `jsonRepository.test.js`)
- **Total: 25/25 passing** — matches the stated baseline.

## University Requirements vs Baseline — Coverage Map

| # | University requirement | Backend | Frontend | Evidence/doc | Status |
|---|------------------------|:------:|:--------:|:-------------:|--------|
| 1 | Event CRUD + search | ✅ done | ✅ done | ❌ not documented | Baseline complete; evidence missing |
| 2 | Participant registration | ✅ done | ❌ NO UI | ❌ not documented | **Functional gap + evidence gap** |
| 3 | Enroll participants in events | ✅ done | ❌ NO UI | ❌ not documented | **Functional gap + evidence gap** |
| 4 | List event attendees | ✅ done | ❌ NO UI | ❌ not documented | **Functional gap + evidence gap** |
| 5 | REST integration | ✅ done | ✅ (eventsApi fetch) | ❌ not documented | Baseline complete; evidence missing |
| 6 | Reusable components | ⚠️ partially illustrated by `EventForm.jsx` | needs dedicated components (attendee/participant/reg) + documentation | **Partial / evidence gap** |
| 7 | UX/UI | implementation present (styled, a11y patterns) | not documented; no screenshots | **Evidence gap** |
| 8 | Automated FE + BE tests | ✅ 13 FE / 12 BE exist | not documented as the required “six examples each with screenshots” | **Evidence gap** |
| 9 | Technical document (architecture, UX/UI, React components, API, testing strategy) | — | — | ❌ not created | **Deliverable missing** |
| 10 | Exactly six FE + six BE test examples WITH screenshots | source material exists (>6 each) | selection + screenshots not produced | **Deliverable missing** |
| 11 | GitHub repository with meaningful commit history | — | — | ❌ **git has ZERO commits** | **Governance blocker** |

## Remaining Functional Scope (build only these — do NOT touch baseline)

1. **Frontend participant module**: UI to create a participant (name + email) and list participants. Backed by existing `GET/POST /api/participants`.
2. **Frontend registration module**: UI to enroll a participant into an event (select event + participant, surface conflict/capacity errors from API) backed by existing `POST /api/events/:id/registrations`.
3. **Frontend attendees module**: UI to list the attendees of a selected event backed by existing `GET /api/events/:id/attendees`.
4. **Reusable component discipline**: extract at least one new reusable presentational component (e.g. `ParticipantList`, `AttendeeList`, or a shared `ListPanel`) following the prop-injected, testable pattern already established by `EventForm.jsx`. Existing `EventForm.jsx` already counts as one reusable component; the new work must add at least one more to strengthen the “reusable components” requirement.
5. **New test examples** for the participant/registration/attendee frontend flows (prop-injected, vitest + testing-library) and equivalent backend integration tests, so the final test set still has at least six codified examples per layer.

> Non-goal: do NOT rewrite the event CRUD/search backend or frontend, do NOT change the JSON persistence to a real DB, do NOT add auth/user accounts/login, do NOT migrate to TypeScript.

## Documentation / Evidence Deliverables (no app code change)

1. **Technical document** covering, at minimum:
   - System architecture (workspaces, frontend ↔ REST ↔ JSON store, prop-injection testability pattern).
   - UX/UI design (hero, event grid, form layout, responsive behavior, a11y patterns: `aria-invalid`, `aria-describedby`, `role=status/alert`, `sr-only`).
   - React components inventory + responsibilities (`App.jsx`, `EventForm.jsx`, new participant/registration/attendee components, `eventsApi.js`).
   - REST API reference (routes, payloads, status codes, error model).
   - Testing strategy (layers, runners, prop injection, JSON-repo concurrency test, race-condition tests).
2. **Exactly six frontend + six backend test examples with screenshots**:
   - Select six representative tests per layer from the existing (and newly added) test sets.
   - Capture a screenshot per example (test execution output for backend; rendered component or execution output for frontend).
   - Place screenshots + per-example captions in a versioned `docs/` folder committed to the repo.
3. **GitHub repository + meaningful commit history**:
   - There are currently ZERO commits. An initial baseline commit must exist before any chained PR can target a base branch.
   - All subsequent work follows the `work-unit-commits` skill (one deliverable behavior per commit, tests/docs kept with the behavior, conventional commit messages).

## Affected Areas

### To create (new)
- `frontend/src/api/participantsApi.js` (or extend `eventsApi.js`) — fetch wrappers for participants + registrations + attendees.
- `frontend/src/components/ParticipantsPanel.jsx` (or equivalent) — participant create + list.
- `frontend/src/components/RegistrationPanel.jsx` — enroll participant into event.
- `frontend/src/components/AttendeesPanel.jsx` — list attendees for selected event.
- `frontend/src/components/__tests__/*.test.jsx` — new vitest examples (prop-injected).
- `frontend/src/App.jsx` — orchestrate the new panels alongside the existing event list/form (composition only; do NOT refactor baseline behavior).
- `frontend/src/styles.css` — minimal additions for new panels (match existing design system).
- `docs/` — technical document + selected test-example screenshots.
- New backend integration tests for any registration/attendee edge case not yet covered (optional; backend routes already largely covered).

### To document only (no app change)
- `README.md`, `openspec/`, and a new `docs/technical-document.*` cover the architecture, UX/UI, components, API, testing strategy.

### NOT to be modified
- `backend/src/*` baseline route/service/repository/validation behavior.
- `frontend/src/App.jsx` baseline event-list/search/edit/delete behavior and its existing tests.
- `frontend/src/EventForm.jsx` and `frontend/src/styles.css` existing classes.

## Approaches

### Approach A — Foundation slice first (RECOMMENDED)
1. Slice 1 (foundation, no app code): initial baseline git commit + README polish + `docs/` scaffold. Unlocks the chained-PR base branch.
2. Slice 2 (functional): frontend participant/registration/attendee modules + their tests (the only app-code change in this change).
3. Slice 3 (evidence): select the six/six examples, capture screenshots, document.
4. Slice 4 (docs): technical document.
- Pros: smallest first slice, clean base for `force-chained`, each slice independently reviewable, tests live with behavior per `work-unit-commits`.
- Cons: requires upfront commit discipline before any feature PR.
- Effort: Low (slice 1) / Medium (slice 2) / Low–Medium (slices 3–4).

### Approach B — Single functional slice then docs
1. Slice 1: all participant/registration/attendee UI + tests in one PR.
2. Slice 2: docs + screenshots.
- Pros: faster to “feature complete”.
- Cons: slice 1 risks exceeding the 400-line review budget (three new panels + tests + style additions), forcing an after-the-fact split; no git baseline commit until the end.
- Effort: Medium-High (slice 1) / Low-Medium (slice 2).

### Approach C — Docs/evidence first, functionality last
1. Slice 1: git baseline commit + screenshots of CURRENT tests (the “six examples” can be drawn from existing tests today).
2. Slice 2: technical document.
3. Slice 3: participant/registration/attendee UI + tests.
- Pros: evidence deliverable unblocked immediately; lower risk on the functional slice.
- Cons: the selected six examples may need to be re-chosen once the new functional tests exist (rework); screenshots of tests not yet showing the participant flow misrepresent final coverage.
- Effort: Low / Low-Medium / Medium.

## Recommendation

**Approach A — Foundation slice first.** `delivery_strategy` is `force-chained`, and nothing can chain without an initial commit and a base branch. The foundation slice (git baseline + README + `docs/` scaffold) is the smallest independent work unit, contains no app-code change, and unlocks every later chained slice. The functional slice (participant/registration/attendee UI + tests) then becomes a clean second PR; the evidence and technical-document slices follow as separate, low-risk PRs. Each slice has a clear start, clear finish, its own verification, and an independent rollback.

## Risks

- **R1 — Chain strategy undecided.** `force-chained` is set in `openspec/config.yaml` but the specific chain (feature-branch-chain vs trunk-PR-chain) and base branch name (`master` vs `main`, university may expect `main`) are not yet chosen. Choosing silently would violate the user’s instruction; this must be resolved before the proposal phase.
- **R2 — Screenshot expectation ambiguous.** “Six examples with screenshots” could mean (a) screenshots of test execution output, (b) rendered-component screenshots, or both. The format materially changes the evidence slice work.
- **R3 — Tech document language.** Coursework context (“Desarrollo de aplicaciones Web”) may expect Spanish; SDD Language Domain Contract defaults technical artifacts to English. The student deliverable language is a product decision.
- **R4 — GitHub remote unknown.** No remote URL is configured and there are zero commits. A meaningful commit history needs a remote to push to; public vs private is the student’s/registrar’s decision.
- **R5 — UX structure for new flows.** Existing app is a single page (no router). Whether participant/registration/attendee UI lives as sections in the same page or new routes is an open UX/product decision (no router installed today).
- **R6 — Seed data.** Screenshots may need seeded events/participants for realistic renders; current `db.json` shape is fine but sample content is undetermined.
- **R7 — Review budget breach on functional slice.** Three new panels + tests + style additions could exceed 400 authored lines in one PR; Approach A mitigates by isolating functional work but the split inside slice 2 must still respect the budget (which the `sdd-tasks` forecast will quantify).
- **R8 — Quality tooling absence.** No linter/formatter/type checker/CI. Not explicitly required by the university checklist, but a reviewer/meainingful-history narrative benefits from at least a lint step. Listed as awareness, not in scope unless the user asks.

## First-Slice Boundary (recommended)

**Slice 1 — Foundation (no application code change):**
- Start: empty git history (current state, zero commits).
- Finish: initial baseline commit on the chosen base branch, `README.md` accurate, `docs/` scaffold present, `openspec/` already in place.
- Verification: `npm test` still 25/25 (untouched baseline), `git log --oneline` shows the baseline commit.
- Rollback: `git reset` of the foundation commits (no app code to revert).
- Maps to a single work-unit commit (or one baseline + one docs-scaffold commit) and becomes the base for every subsequent chained PR.

## Non-Goals

- Rebuild or refactor the existing event CRUD/search backend or frontend.
- Replace JSON persistence with a real database.
- Add authentication, user accounts, sessions, or login.
- Migrate to TypeScript or introduce a linter/formatter/CI pipeline (unless explicitly accepted by the user).
- Add E2E tests (no E2E layer configured; not in the university checklist).
- Modify persisted `db.json` behavior or its serialized-write contract.
- Introduce a router unless the UX/product decision explicitly calls for routes.

## Ready for Proposal

**Yes — contingent.** The orchestrator should surface the Unresolved Decisions below to the user before launching `sdd-propose`:

## Unresolved Product Decisions (require user input before proposal)

1. **Chain strategy + base branch**: which chain pattern (feature-branch-chain vs trunk-PR-chain), and should the base branch be renamed `master → main`?
2. **Screenshot format**: screenshots of test execution output, rendered components, or both?
3. **Technical document language**: English (SDD default) or Spanish (coursework context)?
4. **GitHub remote**: provide the repository URL, and public or private?
5. **UX structure for new flows**: single-page sections (extend current App) vs add a lightweight router with separate routes?
6. **Seed data for screenshots**: use specific seeded events/participants, or whatever the empty/realistic state is at capture time?

---

## Result Contract (executor envelope)

- **status**: success
- **executive_summary**: Explored AgendaU at `D:\cursos\Desarrollo de aplicaciones Web\Final`; verified the React+Express+JSON baseline (25/25 tests green) and mapped it against the university deliverable checklist. The event CRUD/search and REST layers are complete; the remaining work is (a) frontend participant/registration/attendee UI, (b) the technical document, (c) exactly six FE + six BE test examples with screenshots, and (d) establishing a meaningful GitHub commit history (currently zero commits, all files untracked). Produced the explore artifact in both OpenSpec and Engram under the change name `university-deliverables-completion`; no application code was modified.
- **artifacts**:
  - OpenSpec: `openspec/changes/university-deliverables-completion/exploration.md`
  - Engram: `sdd/university-deliverables-completion/explore` (project `final`)
- **next_recommended**: `sdd-propose` — after the orchestrator resolves the Unresolved Product Decisions (chain strategy/base branch, screenshot format, document language, GitHub remote, UX structure, seed data).
- **risks**: R1 chain strategy undecided (must not choose silently); R2 screenshot format ambiguous; R3 document language undecided (English default vs Spanish coursework); R4 GitHub remote unknown and zero commits (governance blocker for `force-chained`); R5 UX structure open; R6 seed data undetermined; R7 functional slice may exceed 400-line budget if not split; R8 quality tooling absent (awareness, not in scope).
- **skill_resolution**: `paths-injected` — 2 skills (`sdd-explore`, `work-unit-commits`) provided as exact `SKILL.md` paths in the launch prompt; `_shared` references (`sdd-phase-common.md`, `openspec-convention.md`, `persistence-contract.md`, `sdd-status-contract.md`) loaded as supporting material. No skill-registry fallback needed.