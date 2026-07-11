# Design: Complete University Deliverables

## Technical Approach

Extend the single-page `App.jsx` with three new panel sections below the existing event grid — Participant List/Create, Enrollment, and Attendee List. Each panel owns its data-fetching lifecycle following the same `useEffect` + `mutationRevision` stale-response guard already proven in the event section. A new `participantsApi.js` adapter mirrors the `eventsApi.js` pattern (shared `mutate` helper, typed errors). One reusable presentational component (`StatusPanel`) wraps loading/empty/error rendering; domain sections inject it via props. Backend is immutable — zero production changes, test additions only if spec coverage gaps exist.

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|---|---|---|---|
| Data-fetching pattern | Per-section `useEffect` + `useRef` revision guard (mirror App baseline) | `useReducer`, external store, React Query | No new dependencies; existing pattern handles stale writes, debounce, and test injection. Budget prohibits library migrations. |
| API adapter | `frontend/src/api/participantsApi.js` with internal `mutate` helper | Inline fetch in components, single mega-adapter | Follows `eventsApi.js` module boundary; each section injects its adapter as a prop for test isolation. |
| Reusable boundaries | Single `StatusPanel` presentational component (children + `state` + `errorMessage` props) | Per-state components, HOC | One reusable unit satisfies R4 and reduces duplication; EventForm already models the prop-injection pattern. |
| Section composition | Three `<section>` blocks appended to `<main>` in App.jsx; each self-contained with own state machine | Separate routes/pages, tabs | Spec requires single-page without navigation; sections stay below the event grid for scroll-based discovery. |
| Error discrimination | Enrollment parses HTTP status to surface "already registered" (409), "capacity reached" (409 w/ specific message), "not found" (404) | Generic catch-all | Backend error messages match the spec's exact strings; frontend must discriminate to meet R2 scenarios. |
| No backend changes | Immutable production code | n/a | Proposal constraint; existing endpoints fully serve the new UI. |
| Slice strategy | Stacked-to-main: slice-1 (baseline commit) → slice-2 (participant UI) → slice-3 (registration+attendee) → slice-4 (evidence) → slice-5 (coursework doc) | Feature-branch chain, single PR | force-chained requires PRs targeting main; each slice is autonomous and reversible. |

## Data Flow

```
ParticipantForm ──→ participantsApi.create() ──→ POST /api/participants
       │                                              │
       └── on success: invalidate ParticipantList ────┘

EnrollmentSection ──→ participantsApi.register() ──→ POST /api/events/:id/registrations
       │                                                   │
       └── on success: invalidate AttendeeList ────────────┘

AttendeeList ←── participantsApi.getAttendees(id) ←── GET /api/events/:id/attendees
```

Each section reads its own data independently and uses a local `mutationRevision` ref to discard stale responses after mutations, identically to the existing event list guard.

## File Changes

| File | Action | Description |
|---|---|---|
| `frontend/src/api/participantsApi.js` | Create | Adapter for GET/POST participants, POST registrations, GET attendees |
| `frontend/src/components/StatusPanel.jsx` | Create | Reusable presentational: loading spinner, empty message, error alert |
| `frontend/src/components/ParticipantSection.jsx` | Create | List + create form; owns participant state machine |
| `frontend/src/components/EnrollmentSection.jsx` | Create | Event+participant selectors, submit, error discrimination |
| `frontend/src/components/AttendeeSection.jsx` | Create | Attendee list per selected event; owns attendee state machine |
| `frontend/src/App.jsx` | Modify | Append three section components; no existing logic touched |
| `frontend/src/styles.css` | Modify | Additive section/panel styles (no existing rule changed) |
| `frontend/src/App.test.jsx` | Modify | Add participant/registration/attendee test blocks (additive) |
| `frontend/src/test/setup.js` | Modify | None needed; existing jsdom setup covers new tests |
| `backend/test/app.test.js` | Modify | Additive tests only if coverage gaps exist; no prod changes |
| `docs/` (new directory) | Create | Spanish technical document + evidence screenshots |

## Interfaces / Contracts

```js
// participantsApi.js — mirrors eventsApi.js pattern
getParticipants()              → GET    /api/participants          → Participant[]
createParticipant({name,email})→ POST   /api/participants          → Participant (201)
getAttendees(eventId)           → GET    /api/events/:id/attendees  → Participant[]
register(eventId, participantId)→ POST   /api/events/:id/registrations → Registration (201)
// Errors throw with message from response body (404, 409, 400)
```

```jsx
// StatusPanel — reusable presentational
<StatusPanel state="loading|empty|error" emptyMessage="..." errorMessage="...">
  {children}  {/* rendered when state === 'ready' */}
</StatusPanel>
```

```jsx
// Section prop-injection pattern (mirrors App pattern)
<ParticipantSection
  loadParticipants={getParticipants}
  addParticipant={createParticipant}
/>
<EnrollmentSection
  loadEvents={getEvents}
  loadParticipants={getParticipants}
  registerParticipant={register}
/>
<AttendeeSection
  loadAttendees={getAttendees}
/>
```

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Frontend unit/integration | Loading, empty, error, success, duplicate, capacity, race-condition per section | vitest + @testing-library/react with prop-injected mock adapters; follow existing `deferred()` pattern for stale-response tests |
| Backend integration | No new production tests required; additive tests only if participant/registration/attendee coverage gaps found | supertest (existing pattern) |

**Strict TDD**: RED test → minimal GREEN implementation → REFACTOR. No implementation before its test.

**Race-condition test**: Deferred participant list response must not overwrite a create that completed first (identical to App.test.jsx "does not let an older list response overwrite a successful create").

## Slice Boundaries (Force-Chained)

| Slice | Scope | Files | Authoried Lines (est.) | Verification |
|---|---|---|---|---|
| 1 — baseline | Initial `feat: preserve working baseline` commit; no app changes | `.gitignore`, existing tree | 0 new | 25/25 green |
| 2 — participant UI | `participantsApi.js`, `StatusPanel.jsx`, `ParticipantSection.jsx`, tests, styles | 4 new + 2 modified | ~200 | npm test (31+ tests) |
| 3 — enrollment + attendees | `EnrollmentSection.jsx`, `AttendeeSection.jsx`, tests, styles, App.jsx sections | 3 new + 3 modified | ~300 | npm test (38+ tests) |
| 4 — evidence | 12 screenshots + capture notes | 12 images + 1 doc | 0 authored | manual capture |
| 5 — coursework doc | `docs/` Spanish document | 1 md | 0 authored | manual review |

**Rollback**: Revert any slice's commits; prior slices remain green. Slice 2 removes participant UI but events still work. Slice 3 removes enrollment/attendees without breaking participant UI.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary changed by this design.

## Migration / Rollout

No migration required. Backend is immutable. Frontend is additive composition — sections render below the existing event grid on the same page.

## Open Questions

- [ ] Should enrollment section re-fetch events list internally or receive events as a prop from App? (Design assumes injected `loadEvents` prop for test isolation; if App already holds events in state, passing them avoids redundant fetch.)
