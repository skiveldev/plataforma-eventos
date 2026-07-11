# Coursework Delivery Evidence Specification

## Purpose

Spanish-language professional technical document and exactly twelve documented test examples (six frontend, six backend) with terminal/result screenshots only. No rendered-UI screenshots.

## Requirements

| # | Requirement | RFC 2119 |
|---|-------------|----------|
| R1 | Produce a professional neutral-Spanish technical document covering architecture, UX/UI, React components, API reference, and testing strategy | MUST |
| R2 | Document exactly six frontend test examples with execution-result screenshots | MUST |
| R3 | Document exactly six backend test examples with execution-result screenshots | MUST |
| R4 | Screenshots SHALL show terminal/result output only — no rendered UI captures | MUST |
| R5 | Demonstration data SHALL be created manually before capture; no seed scripts | MUST |

### Requirement R1: Spanish technical document

The system MUST produce a `docs/` file written in professional neutral Spanish (not regional variant) containing, at minimum: system architecture diagram/description, UX/UI design rationale (hero, grid, form, responsive patterns, accessibility), React component inventory with responsibilities, REST API endpoint reference (routes, payloads, status codes, error model), and testing strategy (layers, runners, prop injection, race-condition guards).

#### Scenario: Document covers all required sections

- GIVEN the project baseline and new participant/registration/attendee modules exist
- WHEN the document is reviewed against the university checklist
- THEN architecture, UX/UI, components, API, and testing sections are present
- AND content is in neutral professional Spanish

#### Scenario: Document references existing and new components

- GIVEN `EventForm.jsx` existed before and new panels were added
- WHEN reviewing the component inventory section
- THEN both EventForm and each new participant/registration/attendee component are listed
- AND responsibilities are described per component

### Requirement R2: Six frontend test examples

The system MUST select and document exactly six frontend test examples covering at minimum: one loading state, one empty state, one error state, one successful create/mutation, one prop-injection verification, and one race-condition test. Each example MUST include the test code reference, its purpose, and a screenshot of terminal execution output.

#### Scenario: Six frontend examples span required categories

- GIVEN the test suite has 13+ frontend tests after new work
- WHEN six examples are selected for documentation
- THEN each required category is covered by at least one example
- AND each example has a terminal-output screenshot

### Requirement R3: Six backend test examples

The system MUST select and document exactly six backend test examples covering at minimum: one health/status check, one successful entity creation, one validation rejection, one duplicate/conflict rejection, one list/search, and one cascading-delete or concurrency test. Each example MUST include the test code reference, its purpose, and a screenshot of terminal execution output.

#### Scenario: Six backend examples span required categories

- GIVEN the test suite has 12+ backend tests
- WHEN six examples are selected for documentation
- THEN each required category is covered by at least one example
- AND each example has a terminal-output screenshot

### Requirement R4: Screenshot constraints

Screenshots SHALL capture terminal/console test-runner output only (Vitest results, assertion summaries, pass/fail counts). Screenshots MUST NOT capture rendered browser UI, styled components, or application layout.

#### Scenario: Screenshot is terminal-only

- GIVEN a test example is selected
- WHEN its screenshot is captured
- THEN the image shows test-runner output (test name, assertions, pass/fail)
- AND no browser window or rendered component is visible

### Requirement R5: Manual demonstration data

All demonstration data used during evidence capture MUST be created manually through the running application. No seed scripts, database dumps, or fixtures SHALL pre-populate the data store beyond what the user enters via the UI or direct API calls.

#### Scenario: Data is manually created

- GIVEN evidence capture is about to start
- WHEN data is needed for a test or screenshot
- THEN data is entered through the application UI or API
- AND no automated seed script is executed
