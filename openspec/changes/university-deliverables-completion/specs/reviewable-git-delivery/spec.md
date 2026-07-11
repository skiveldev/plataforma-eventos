# Reviewable Git Delivery Specification

## Purpose

Establish a meaningful Git commit history from the current zero-commit state, then deliver stacked-to-main work-unit slices that are independently reviewable and reversible under a 400-line budget with strict TDD mode.

## Requirements

| # | Requirement | RFC 2119 |
|---|-------------|----------|
| R1 | Establish a Git baseline commit preserving the untouched working state | MUST |
| R2 | Structure delivery as stacked-to-main slices, each a work-unit commit | MUST |
| R3 | Keep each slice under 400 authored changed lines | MUST |
| R4 | Each slice MUST pass `npm test` independently before the next slice begins | MUST |
| R5 | Each slice MUST be independently reversible without affecting earlier slices | MUST |
| R6 | Use Conventional Commit messages describing behavior, not file lists | MUST |

### Requirement R1: Baseline commit

The system MUST create an initial Git commit that captures the complete working baseline (25/25 tests green, all source files). This commit SHALL NOT include any new application code, docs, or evidence. Its message MUST indicate it is the preserved baseline.

#### Scenario: Baseline commit is clean

- GIVEN zero commits exist in the repository
- WHEN the baseline commit is created
- THEN `git log --oneline` shows exactly one commit
- AND `npm test` passes 25/25
- AND no new files beyond the working baseline are included

### Requirement R2: Stacked-to-main slices

The delivery MUST use stacked branches targeting `main`. Each slice branch SHALL branch from the previous slice's tip (or `main` for the first functional slice). The chain order SHALL follow the proposal's delivery slices: Git baseline → participant UI → registration+attendee UI → evidence → coursework document.

#### Scenario: Slice chain is reviewable

- GIVEN the baseline commit exists on `main`
- WHEN slice N is opened as a PR targeting `main` (or its parent slice branch)
- THEN its diff contains only the work for that slice
- AND no files from earlier or later slices appear in the diff

### Requirement R3: 400-line budget

Each slice's authored additions plus deletions MUST NOT exceed 400 lines. Generated golden/test-output files are excluded from authored count but included in complete snapshot identity.

#### Scenario: Slice under budget

- GIVEN a slice is ready for review
- WHEN its authored diff is measured
- THEN `additions + deletions` ≤ 400
- AND generated/output files are excluded from the count

### Requirement R4: Independent verification

Every slice MUST pass `npm test` in strict TDD mode — the test command runs the full suite and every test MUST be green. No slice SHALL merge with failing tests.

#### Scenario: Slice passes full test suite

- GIVEN a slice branch with its work committed
- WHEN `npm test` runs
- THEN exit code is 0
- AND all tests pass (25+ baseline, plus slice-specific new tests)

### Requirement R5: Independent reversibility

Each slice MUST be independently reversible: reverting a slice's commits SHALL restore the working tree to the previous slice's passing state without breaking earlier or later slices.

#### Scenario: Rollback restores prior state

- GIVEN slices 1, 2, and 3 are applied to `main`
- WHEN slice 3's commits are reverted
- THEN `npm test` still passes (slice 2 state)
- AND no files from slice 3 remain

### Requirement R6: Conventional Commits

All commit messages MUST follow Conventional Commits (`feat:`, `docs:`, `test:`, `chore:`). Messages SHALL describe the behavioral outcome, not the file list.

#### Scenario: Commit follows convention

- GIVEN a work-unit commit is created for the participant-list feature
- WHEN its message is inspected
- THEN it starts with `feat(participants):`
- AND the description explains what the user can now do
- AND no file paths appear in the summary line
