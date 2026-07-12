# AgendaU Slice 2 — Review Policy

**Scope:** Academic university coursework project. Review only Slice 2 participant UI delta against existing baseline ddd1e60. Whole-tree baseline (events, backend, auth, production observability) is OUT OF SCOPE.

**Size exception:** Maintainer-approved `size:exception` for this Slice 2 participant PR (~640 authored code+test lines). Applies only to this slice.

**Delivery:** force-chained, stacked-to-main.

**Review rules per academic scope:**
- Validate participant API contracts, component behavior, tests, and determinism.
- Do not block on missing auth/authorization, production observability, persistence hardening, or deployment recovery — these are explicitly non-goals for the coursework.
- WARNING/SUGGESTION findings are informational and non-blocking.
- Every BLOCKER/CRITICAL must cite exact deterministic code path and proof reference.
