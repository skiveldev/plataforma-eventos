# Participant Registration UI Specification

## Purpose

Frontend participant management, enrollment, and attendee display as single-page sections using existing REST endpoints. Backend behavior is immutable; all requirements describe additive frontend-only behavior.

## Requirements

| # | Requirement | RFC 2119 |
|---|-------------|----------|
| R1 | Present participant create/list sections on the existing single page | MUST |
| R2 | Enroll participants into events with duplicate, capacity, and missing-resource feedback | MUST |
| R3 | Display attendees per selected event | MUST |
| R4 | Expose reusable, prop-injected presentational components | MUST |
| R5 | Cover loading, empty, error states for each user interaction | MUST |

### Requirement R1: Participant create/list UI

The system MUST render a participant section on the existing page that lists all participants and accepts a name+email form to create new ones, using the existing `GET/POST /api/participants` endpoints. The section MUST show loading, empty, and API-error states.

#### Scenario: List participants successfully

- GIVEN the backend has participants
- WHEN the page loads the participant section
- THEN participant names and emails are displayed
- AND the create form is available

#### Scenario: Empty participant list

- GIVEN no participants exist in the backend
- WHEN the page loads the participant section
- THEN an empty-state message is shown
- AND the create form remains available

#### Scenario: API failure loading participants

- GIVEN the participant GET endpoint returns an error
- WHEN the page loads the participant section
- THEN an inline error message is displayed
- AND the create form remains available

#### Scenario: Create a participant

- GIVEN the participant form is filled with valid name and email
- WHEN the user submits the form
- THEN the participant appears in the list
- AND the form clears for the next entry

#### Scenario: Create fails with duplicate email

- GIVEN a participant with the same email already exists
- WHEN the user submits the create form
- THEN the API error message is displayed
- AND the form fields are preserved

### Requirement R2: Enrollment with feedback

The system MUST provide an enrollment section where a user selects an existing event and participant, then submits via `POST /api/events/:id/registrations`. The system MUST display specific error messages for duplicate registration (409), full capacity (409), and missing event/participant (404).

#### Scenario: Successful enrollment

- GIVEN event "Workshop" has capacity > 0 and participant "Sam" is not enrolled
- WHEN the user selects both and submits enrollment
- THEN a success confirmation is shown
- AND the attendee list updates to include "Sam"

#### Scenario: Duplicate enrollment rejected

- GIVEN "Sam" is already enrolled in "Workshop"
- WHEN the user attempts to enroll "Sam" again
- THEN "Participant is already registered" is displayed

#### Scenario: Capacity reached

- GIVEN "Workshop" has capacity 1 and is already full
- WHEN the user attempts to enroll another participant
- THEN "Event capacity reached" is displayed

#### Scenario: Missing resource

- GIVEN the selected event or participant does not exist on the server
- WHEN the user attempts enrollment
- THEN the specific API error is displayed

### Requirement R3: Attendee list

The system MUST display attendees for a selected event using `GET /api/events/:id/attendees`. The attendee section MUST show loading, empty (no registrations), and error states.

#### Scenario: List attendees

- GIVEN "Workshop" has two enrolled participants
- WHEN the user selects "Workshop" and views attendees
- THEN both participant names and emails are shown

#### Scenario: Empty attendees

- GIVEN "Workshop" has zero registrations
- WHEN the user views its attendees
- THEN an empty-state message is displayed

### Requirement R4: Reusable boundaries

The system MUST include at least one new reusable presentational component that receives data and callbacks exclusively via props, following the `EventForm.jsx` prop-injection pattern. Each new panel SHALL be independently testable by injecting mock API functions and data.

#### Scenario: Component receives behavior via props

- GIVEN a reusable component is rendered with injected callback props
- WHEN the component triggers a user action
- THEN the injected callback is invoked with correct arguments
- AND no global/fetch side effects occur

### Requirement R5: State coverage

Every user-facing section (participant list, enrollment form, attendee list) MUST render distinct states for loading, empty-results, and API-failure conditions.

#### Scenario: Loading states distinct across sections

- GIVEN each section has an active API call in flight
- WHEN the page renders
- THEN each section independently shows its own loading indicator
- AND other sections may already show results
