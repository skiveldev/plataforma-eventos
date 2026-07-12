# Evidencia de Ejecución de Pruebas

Ejecución individual de 12 pruebas representativas (6 frontend + 6 backend) con captura de salida de terminal. Las evidencias completas se encuentran en la carpeta `docs/evidence/`.

## Pruebas Frontend (Vitest + React Testing Library)

| Archivo | Prueba | Archivo de origen | Propósito | Resultado |
|---------|--------|-------------------|-----------|-----------|
| `fe-01-event-create.txt` | "creates an event and adds it to the list" | `frontend/src/App.test.jsx` | Verifica que el formulario de creación de eventos llama al API y agrega el evento a la lista | ✅ 1 passed |
| `fe-02-event-search.txt` | "searches through the API boundary" | `frontend/src/App.test.jsx` | Verifica que la búsqueda por texto llama al API con el término correcto | ✅ 1 passed |
| `fe-03-participant-create.txt` | "calls addParticipant with name and email on form submission" | `frontend/src/components/ParticipantSection.test.jsx` | Verifica que el formulario de participante envía nombre y email al adaptador API | ✅ 1 passed |
| `fe-04-participant-validation-error.txt` | "shows validation error and does not call addParticipant for malformed email" | `frontend/src/components/ParticipantSection.test.jsx` | Verifica validación del lado cliente: email malformado muestra error y no llama al API | ✅ 1 passed |
| `fe-05-enrollment-success.txt` | "calls registerParticipant with selected event and participant and shows success" | `frontend/src/components/EnrollmentSection.test.jsx` | Verifica inscripción exitosa: selección de evento y participante, llamado al API, mensaje de éxito | ✅ 1 passed |
| `fe-06-attendee-list.txt` | "lists attendee names and emails on successful load" | `frontend/src/components/AttendeeSection.test.jsx` | Verifica que la lista de asistentes muestra nombres y emails al cargar exitosamente | ✅ 1 passed |

## Pruebas Backend (Vitest + Supertest)

| Archivo | Prueba | Archivo de origen | Propósito | Resultado |
|---------|--------|-------------------|-----------|-----------|
| `be-01-get-events.txt` | "searches events" | `backend/test/app.test.js` | Verifica GET /api/events?search=testing devuelve eventos filtrados | ✅ 1 passed |
| `be-02-post-event-validation.txt` | "rejects invalid event data" | `backend/test/app.test.js` | Verifica que POST /api/events con datos incompletos devuelve 400 | ✅ 1 passed |
| `be-03-get-participants.txt` | "creates and lists participants" | `backend/test/app.test.js` | Verifica POST /api/participants crea un participante y GET /api/participants lo lista | ✅ 1 passed |
| `be-04-post-registration-duplicate.txt` | "prevents duplicate registrations" | `backend/test/app.test.js` | Verifica que una segunda inscripción del mismo participante al mismo evento devuelve 409 | ✅ 1 passed |
| `be-05-post-registration-capacity.txt` | "rejects capacity below the current registration count" | `backend/test/app.test.js` | Verifica que no se puede reducir la capacidad por debajo del número de inscritos actuales | ✅ 1 passed |
| `be-06-get-attendees.txt` | "registers a participant and lists attendees" | `backend/test/app.test.js` | Verifica POST /api/events/:id/registrations crea inscripción y GET /api/events/:id/attendees lista asistentes | ✅ 1 passed |

## Suite Completa

| Evidencia | Resultado |
|-----------|-----------|
| `full-suite.txt` | 79/79 passed (67 frontend + 12 backend). Build: ✅ |

---

*Capturas generadas el 11 de julio de 2026. Formato: salida de terminal de Vitest con reporter verbose.*
