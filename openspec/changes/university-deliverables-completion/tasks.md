# Tasks: Complete University Deliverables

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~520 (Slice 2: ~170, Slice 3: ~200, Slice 4: ~50, Slice 5: ~100) |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (baseline) → PR 2 (participant UI) → PR 3 (enrollment + attendees) → PR 4 (evidence) → PR 5 (coursework doc) → PR 6 (final verification) |
| Delivery strategy | force-chained |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Establish git baseline + README + docs scaffold | PR 1 | `npm test` (25/25 green) | N/A — no app code changed; baseline commit preserves working state | Root commit `ddd1e60` is the non-revertible repository foundation. Later slices roll back to this baseline; removing Slice 1 requires discarding or reinitializing repository history, not reverting an isolated app delta. |
| 2 | Participant create/list UI + API adapter + StatusPanel | PR 2 | `npm run test -w frontend -- --testNamePattern "participant"` | N/A — prop-injected mock adapters; no live server needed for unit tests | Remove `participantsApi.js`, `StatusPanel.jsx`, `ParticipantSection.jsx`, revert App.jsx/styles.css additions; events baseline unaffected |
| 3 | Enrollment + attendee sections + error discrimination | PR 3 | `npm run test -w frontend -- --testNamePattern "enrollment\|attendee"` | N/A — prop-injected mocks; race-condition tests use `deferred()` pattern | Remove `EnrollmentSection.jsx`, `AttendeeSection.jsx`, revert App.jsx section mounts + styles; participant UI from PR 2 remains green |
| 4 | Six FE + six BE evidence screenshots + capture notes | PR 4 | N/A — manual capture of existing test output | `npm run test -w frontend` + `npm run test -w backend` output screenshots | Remove `docs/evidence/` images + notes; no runtime impact |
| 5 | Spanish coursework technical document | PR 5 | N/A — document review against spec checklist | N/A — manual review of doc sections | Remove `docs/technical-document.md`; no runtime impact |
| 6 | Final acceptance verification + submission polish | PR 6 | `npm test` (full suite, all green) | Full app smoke test: create participant → enroll → view attendees | Revert doc/evidence polish commits; app behavior unchanged |

## Phase 1: Git Baseline + Foundation

- [x] 1.1 Create initial commit capturing the untouched working baseline (all existing source files, `.gitignore`, `openspec/`); verify `npm test` passes 25/25 before commit.
- [x] 1.2 Update `README.md` with accurate project description, stack summary, and run/test instructions (no functional changes).
- [x] 1.3 Create `docs/` directory scaffold with `.gitkeep`; no content yet.
- [x] 1.4 Verify: `git log --oneline` shows baseline commit; `npm test` still 25/25; no app files modified.

## Phase 2: Participant UI (Strict TDD — RED → GREEN → REFACTOR)

### RED Tasks (write failing tests first)

- [x] 2.1 RED: Write test for `StatusPanel` rendering loading state with spinner, empty state with message, and error state with alert; verify test fails (component does not exist).
- [x] 2.2 RED: Write test for `StatusPanel` rendering children when state is `ready`; verify test fails.
- [x] 2.3 RED: Write test for `ParticipantSection` loading state on mount; verify test fails (no adapter/component).
- [x] 2.4 RED: Write test for `ParticipantSection` displaying empty message when `getParticipants` returns `[]`; verify test fails.
- [x] 2.5 RED: Write test for `ParticipantSection` listing participant names/emails on successful load; verify test fails.
- [x] 2.6 RED: Write test for `ParticipantSection` API error state when `getParticipants` throws; verify test fails.
- [x] 2.7 RED: Write test for `ParticipantSection` form submission calling `addParticipant` with name+email; verify test fails.
- [x] 2.8 RED: Write test for `ParticipantSection` form clearing and list updating after successful create; verify test fails.
- [x] 2.9 RED: Write test for `ParticipantSection` preserving form fields and showing error on duplicate email (409); verify test fails.
- [x] 2.10 RED: Write race-condition test: older list response must not overwrite a successful create (mirror App.test.jsx pattern using `deferred()`); verify test fails.

### GREEN Tasks (minimal implementation to pass tests)

- [x] 2.11 Create `frontend/src/api/participantsApi.js` with `getParticipants()`, `createParticipant({name, email})` using shared `mutate` helper pattern from `eventsApi.js`.
- [x] 2.12 Create `frontend/src/components/StatusPanel.jsx` — presentational component accepting `state` (`loading|empty|error|ready`), `emptyMessage`, `errorMessage`, and `children` props.
- [x] 2.13 Create `frontend/src/components/ParticipantSection.jsx` with `useEffect` + `useRef` mutationRevision guard, loading/empty/error/ready states, and create form.
- [x] 2.14 Add additive CSS rules to `frontend/src/styles.css` for participant section layout (no existing rule modified).
- [x] 2.15 Mount `<ParticipantSection>` in `frontend/src/App.jsx` below event grid; inject `loadParticipants` and `addParticipant` props from existing API.
- [x] 2.16 Verify: `npm run test -w frontend` passes all participant tests + original 13; `npm test` full suite green (25 frontend + 12 backend = 37 total).

### REFACTOR Tasks

- [x] 2.17 Extract shared loading/error patterns between EventSection and ParticipantSection if duplication exceeds 3 lines; verify tests still pass. — No extraction needed: existing event section pattern uses inline conditionals (3 lines each) which are already compact. ParticipantSection uses StatusPanel. No meaningful duplication to extract; 37/37 tests still green.

## Phase 3: Enrollment + Attendee Sections (Strict TDD — RED → GREEN → REFACTOR)

### RED Tasks (write failing tests first)

- [ ] 3.1 RED: Write test for `EnrollmentSection` rendering event selector + participant selector + submit button; verify test fails.
- [ ] 3.2 RED: Write test for successful enrollment: selecting event+participant, calling `register`, showing success confirmation; verify test fails.
- [ ] 3.3 RED: Write test for duplicate enrollment error (409 → "Participant is already registered"); verify test fails.
- [ ] 3.4 RED: Write test for capacity reached error (409 → "Event capacity reached"); verify test fails.
- [ ] 3.5 RED: Write test for missing resource error (404 → specific API error message); verify test fails.
- [ ] 3.6 RED: Write test for `EnrollmentSection` receiving `events` as prop from App (no internal fetch); verify test fails.
- [ ] 3.7 RED: Write test for `AttendeeSection` loading state on mount; verify test fails.
- [ ] 3.8 RED: Write test for `AttendeeSection` displaying empty message when no registrations; verify test fails.
- [ ] 3.9 RED: Write test for `AttendeeSection` listing attendee names/emails on successful load; verify test fails.
- [ ] 3.10 RED: Write test for `AttendeeSection` error state when `getAttendees` throws; verify test fails.
- [ ] 3.11 RED: Write integration test: successful enrollment triggers attendee list refresh (invalidate pattern); verify test fails.

### GREEN Tasks (minimal implementation to pass tests)

- [ ] 3.12 Extend `frontend/src/api/participantsApi.js` with `register(eventId, participantId)` and `getAttendees(eventId)`.
- [ ] 3.13 Create `frontend/src/components/EnrollmentSection.jsx` with event/participant selectors, submit handler, and HTTP status-based error discrimination (409 duplicate, 409 capacity, 404 not found).
- [ ] 3.14 Create `frontend/src/components/AttendeeSection.jsx` with `useEffect` + `useRef` mutationRevision guard, loading/empty/error/ready states.
- [ ] 3.15 Add additive CSS rules to `frontend/src/styles.css` for enrollment form grid and attendee list (no existing rule modified).
- [ ] 3.16 Mount `<EnrollmentSection>` and `<AttendeeSection>` in `frontend/src/App.jsx`; inject `events` prop (from App's existing state), `loadParticipants`, `register`, and `loadAttendees` props.
- [ ] 3.17 Verify: `npm run test -w frontend` passes all new tests + prior tests; `npm test` full suite green (38+ tests).

### REFACTOR Tasks

- [ ] 3.18 Review `StatusPanel` usage across all three sections; confirm single reusable component satisfies R4; extract shared styles if needed.
- [ ] 3.19 Verify prop-injection pattern: each section testable with mock adapters, no global fetch side effects.

## Phase 4: Execution Evidence (Six FE + Six BE)

- [ ] 4.1 Select six frontend test examples covering: loading state, empty state, error state, successful create, prop-injection verification, race-condition guard.
- [ ] 4.2 Select six backend test examples covering: health check, successful entity creation, validation rejection, duplicate/conflict rejection, list/search, cascading delete.
- [ ] 4.3 Create `docs/evidence/` directory for screenshots.
- [ ] 4.4 Capture terminal-output screenshots for each of the 12 test examples (Vitest/supertest results only — no rendered UI).
- [ ] 4.5 Create `docs/evidence/README.md` with per-example captions: test name, file path, purpose, and screenshot reference.
- [ ] 4.6 Verify: exactly 12 screenshots present; each shows terminal output only; no browser/UI renders captured.

## Phase 5: Spanish Coursework Technical Document

- [ ] 5.1 Create `docs/technical-document.md` in professional neutral Spanish.
- [ ] 5.2 Write architecture section: npm workspaces, frontend ↔ REST ↔ JSON store, prop-injection testability pattern.
- [ ] 5.3 Write UX/UI section: hero, event grid, form layout, responsive behavior, accessibility patterns (`aria-invalid`, `aria-describedby`, `role=status/alert`).
- [ ] 5.4 Write React components section: inventory with responsibilities for `App.jsx`, `EventForm.jsx`, `StatusPanel.jsx`, `ParticipantSection.jsx`, `EnrollmentSection.jsx`, `AttendeeSection.jsx`, `eventsApi.js`, `participantsApi.js`.
- [ ] 5.5 Write REST API reference: all routes, payloads, status codes, error model (400/404/409/500).
- [ ] 5.6 Write testing strategy section: layers (unit/integration), runners (vitest/supertest), prop injection, race-condition guards, JSON-repo concurrency test.
- [ ] 5.7 Verify: document covers all five required sections; content in neutral professional Spanish; references both baseline and new components.

## Phase 6: Final Acceptance Verification

- [ ] 6.1 Run full test suite: `npm test` — all tests green (baseline + participant + enrollment + attendee).
- [ ] 6.2 Verify spec acceptance: R1 (participant create/list), R2 (enrollment with error feedback), R3 (attendee list), R4 (reusable prop-injected components), R5 (loading/empty/error states).
- [ ] 6.3 Verify evidence acceptance: exactly 6 FE + 6 BE screenshots, terminal-only, manual data creation documented.
- [ ] 6.4 Verify git delivery: meaningful commit history with Conventional Commits; Slices 2 onward independently revertible to root baseline `ddd1e60`; `npm test` green at each slice tip.
- [ ] 6.5 Verify rollback: revert each later slice's commits individually; prior slices remain green; no cross-slice breakage. Treat Slice 1 / `ddd1e60` as the repository foundation, removable only by discarding or reinitializing history.
- [ ] 6.6 Final smoke test: manually create participant → enroll in event → verify attendee list updates → verify error states (duplicate, capacity).
