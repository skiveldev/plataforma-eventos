# Proposal: Complete University Deliverables

## Intent

AgendaU's working baseline lacks participant-facing UI, coursework evidence, and Git history. Complete only these university deliverables without rebuilding existing behavior.

## Users and Context

- Students submit the project; evaluators review functionality, evidence, documentation, and history.
- Demonstration records are created manually before capture; screenshots prove test execution only.

## Baseline and Delta Scope

Immutable: event CRUD/search, REST/domain behavior, JSON persistence, UI/accessibility patterns, and 25 passing tests (13 frontend, 12 backend).

### In Scope
- Add single-page participant creation/listing, registration, and attendee sections using existing endpoints and reusable, prop-injected components.
- Add focused tests without changing backend production behavior.
- Produce a professional neutral-Spanish coursework document covering architecture, UX/UI, components, API, and testing strategy.
- Document exactly six frontend and six backend test examples; each screenshot shows execution results only.
- Establish Git baseline/history, then use stacked-to-main slices.

### Out of Scope
- Rebuilding/refactoring baseline behavior; router, authentication, database/TypeScript migrations, E2E, CI, linting, or fixed screenshot seed data.

## Capabilities

### New Capabilities
- `participant-registration-ui`: Remaining workflows as sections on the existing page.
- `coursework-delivery-evidence`: Spanish technical document and constrained six-plus-six execution evidence.
- `reviewable-git-delivery`: Baseline history and reviewable stacked-to-main delivery units.

### Modified Capabilities
None; `openspec/specs/` is empty and implemented behavior is immutable.

## Outcomes and Acceptance Direction

- Users can manage participants, register them, see conflict/capacity errors, and list attendees without navigation.
- Existing behavior and tests remain green; new tests cover successful, empty, validation, and API-failure states.
- Submission contains the Spanish document and exactly 12 documented examples/screenshots with no rendered UI evidence.
- Git history begins with the preserved baseline and tells a work-unit story.

## Approach, Constraints, and Implications

Extend `frontend/src/App.jsx` by composition; add adapters, panels, tests, and additive styles. Keep `backend/src/**` production code unchanged. Manual data avoids seed coupling. `strict_tdd`, `force-chained`, interactive execution, hybrid persistence, and a 400-line budget apply.

## Delivery Slices

1. Git baseline/history foundation; no application changes.
2. Participant UI/API/tests.
3. Registration and attendee UI/API/tests; split further if near 400 lines.
4. Six-plus-six execution evidence.
5. Spanish coursework document and submission polish.

Each slice targets `main`, includes verification, and is independently reversible.

## Affected Areas

| Area | Impact |
|---|---|
| Git history, `README.md` | Enabling/documented |
| `frontend/src/App.jsx`, `frontend/src/api/`, `frontend/src/components/`, tests, styles | Additive |
| `docs/` | New Spanish document and evidence |
| `backend/src/` | Immutable production baseline; tests only if needed |

## Edge Cases and Risks

- Empty selections, duplicates, full capacity, stale results, and request failures require explicit states.
- Functional slices may breach 400 lines; subdivide by deliverable behavior.
- No remote and current `master`/empty history block stacked-to-main until `main` baseline setup is resolved.
- Manual records can drift from documentation; record capture prerequisites.

## Rollback Plan

Revert each slice independently; evidence removal must not affect runtime. Preserve the baseline snapshot.

## Dependencies

- Existing backend contracts and green tests; GitHub remote/base-branch setup before stacked PRs.
