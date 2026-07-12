# Documento Técnico — AgendaU

## Plataforma de Eventos Académicos

**Autor:** Trabajo final individual  
**Universidad:** Desarrollo de Aplicaciones Web  
**Fecha:** Julio 2026

---

## 1. Arquitectura del Proyecto

AgendaU es una aplicación web full-stack organizada como un **monorepo npm workspaces** con dos paquetes independientes: `frontend` (React 19 + Vite 7) y `backend` (Express 5 + Node.js). La persistencia utiliza un archivo JSON local con serialización secuencial de lectura-modificación-escritura, adecuado para el entorno académico de desarrollo.

### 1.1 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React + Vite | 19 / 7 |
| Backend | Express | 5 |
| Persistencia | JSON (archivo local) | — |
| Pruebas | Vitest + Testing Library + Supertest | 3 |
| Tooling | npm workspaces | 10+ |
| Lenguaje | JavaScript (ES Modules) | ES2022+ |

### 1.2 Diagrama de Carpetas

```
agendau/
├── package.json                   # npm workspaces root
├── backend/
│   ├── package.json
│   └── src/
│       ├── server.js              # Punto de entrada (puerto 3001)
│       ├── app.js                 # Aplicación Express + rutas REST
│       ├── validation.js          # Validación de entrada (eventos, participantes)
│       ├── services/
│       │   └── agendaService.js   # Lógica de negocio (CRUD, reglas de inscripción)
│       ├── repository/
│       │   └── jsonRepository.js  # Lectura/escritura serializada de db.json
│       └── data/
│           └── db.json            # Almacenamiento persistente
├── frontend/
│   ├── package.json
│   ├── vite.config.js             # Vite + Vitest (jsdom, allowOnly: false)
│   └── src/
│       ├── main.jsx               # Entrada React DOM
│       ├── App.jsx                # Componente raíz: estado global, grid de eventos, secciones
│       ├── EventForm.jsx          # Formulario reutilizable de eventos
│       ├── styles.css             # Estilos responsive con diseño single-page
│       ├── api/
│       │   ├── eventsApi.js       # Adaptador fetch: GET/POST/PUT/DELETE /api/events
│       │   ├── participantsApi.js # Adaptador fetch: GET/POST /api/participants
│       │   └── registrationsApi.js # Adaptador fetch: POST /registrations, GET /attendees
│       ├── components/
│       │   ├── StatusPanel.jsx    # Panel presentacional: loading/empty/error/ready
│       │   ├── ParticipantSection.jsx   # Sección de gestión de participantes
│       │   ├── EnrollmentSection.jsx    # Sección de inscripción a eventos
│       │   └── AttendeeSection.jsx      # Sección de lista de asistentes
│       └── test/
│           └── setup.js           # Configuración jsdom + Testing Library
└── docs/
    ├── evidence/                  # Evidencia de ejecución de pruebas (12 capturas)
    │   └── README.md              # Tabla de referencia de evidencias
    └── documento-tecnico.md       # Este documento
```

### 1.3 Patrón de Diseño: Prop-Injection

La aplicación sigue un patrón de **inyección de dependencias por props** que permite la testeabilidad de cada componente en aislamiento. Los adaptadores de API (`eventsApi`, `participantsApi`, `registrationsApi`) se inyectan como props en los componentes, con valores predeterminados que apuntan a los adaptadores reales:

```jsx
// App.jsx — props con defaults reales para producción
export default function App({
  loadEvents = getEvents,
  addEvent = createEvent,
  loadParticipants = getParticipants,
  enrollParticipant = register,
  loadAttendees = getAttendees,
  // ...
})
```

En pruebas, se inyectan mocks de Vitest (`vi.fn()`) sin que el componente necesite conocer la implementación real de fetch.

---

## 2. Diseño UX/UI

### 2.1 Arquitectura Single-Page

AgendaU se presenta como una **página única con secciones verticales** que guían al usuario a través del flujo de trabajo académico:

1. **Hero / Cabecera** — Marca y descripción de la plataforma
2. **Formulario de eventos** — Crear/editar eventos (colapsable)
3. **Notificaciones** — Mensajes de éxito/error con roles ARIA (`role="alert"`, `role="status"`)
4. **Búsqueda y grid de eventos** — Barra de búsqueda con debounce (250ms) + tarjetas de evento
5. **Gestión de participantes** — Formulario de alta + listado de participantes
6. **Inscripción** — Selectores de evento y participante + botón de inscripción
7. **Lista de asistentes** — Visualización de asistentes por evento seleccionado
8. **Footer** — Marca secundaria

### 2.2 Diseño Responsive

Los estilos CSS utilizan unidades relativas, `max-width` en contenedores, y grid layouts que se adaptan a distintos tamaños de pantalla. Las tarjetas de eventos se organizan en `grid-template-columns: repeat(auto-fill, minmax(...))`.

### 2.3 Estados de UI

Cada sección de datos implementa **cuatro estados distintos**:

| Estado | Comportamiento visual | Rol ARIA |
|--------|----------------------|----------|
| `loading` | Spinner o texto "Loading…" | `role="status"` |
| `empty` | Mensaje contextual ("No participants yet") | Texto estático |
| `error` | Mensaje de error + botón de reintento | `role="alert"` |
| `ready` | Contenido de datos (listas, tarjetas) | Estructura semántica |

El componente `StatusPanel` abstrae esta lógica de estados de forma reutilizable, siendo compartido por `ParticipantSection` y `AttendeeSection`.

### 2.4 Accesibilidad

- Campos de formulario con `<label>` explícito y `htmlFor`/`id`
- Estados de error con `role="alert"` para anuncio automático por lectores de pantalla
- Estados de carga con `role="status"` para notificación no intrusiva
- `aria-invalid` y `aria-describedby` en campos con error de validación
- Navegación y estructura semántica con `<nav>`, `<main>`, `<header>`, `<footer>`
- Botones con texto descriptivo (no solo íconos): "Edit Workshop", "Delete Workshop"

---

## 3. Componentes React

### 3.1 Árbol de Componentes

```
App
├── EventForm              (prop: event, busy, onCancel, onSubmit)
├── [notice]               (condicional: success/error)
├── [Sección de eventos]
│   ├── search input       (debounce 250ms → API boundary)
│   ├── loading/empty/error states
│   └── event-grid
│       └── event-card[]   (título, categoría, fecha, lugar, capacidad, acciones)
├── ParticipantSection     (prop: loadParticipants, addParticipant)
│   ├── StatusPanel        (loading/empty/error/ready)
│   ├── [lista de participantes]
│   └── [formulario de alta + validación cliente]
├── EnrollmentSection      (prop: events, participants, registerParticipant)
│   ├── selector de evento
│   ├── selector de participante
│   └── botón de inscripción + feedback
└── AttendeeSection        (prop: eventId, loadAttendees, revision)
    ├── StatusPanel        (loading/empty/error/ready)
    └── [lista de asistentes]
```

### 3.2 Responsabilidades

| Componente | Responsabilidad | Patrón |
|-----------|----------------|--------|
| **App** | Estado global, coordinación entre secciones, debounce de búsqueda, guardias de concurrencia (`mutationRevision`) | Contenedor con prop-injection |
| **EventForm** | Formulario controlado de creación/edición, validación de capacidad (entero positivo) | Componente controlado |
| **StatusPanel** | Renderizado condicional de estados loading/empty/error/ready | Componente presentacional |
| **ParticipantSection** | Listado de participantes, formulario de alta, validación cliente (whitespace, email), guardia de race-condition (`participantRevision`), botón de reintento en error | Contenedor con prop-injection |
| **EnrollmentSection** | Selectores de evento/participante, discriminación de errores HTTP (409 duplicado, 409 capacidad, 404 no encontrado) | Contenedor con prop-injection |
| **AttendeeSection** | Listado de asistentes filtrado por evento, refresco por `revision`, botón de reintento en error | Contenedor con prop-injection |
| **eventsApi** | Adaptador fetch para CRUD de eventos: `getEvents(query)`, `createEvent`, `updateEvent`, `deleteEvent` | Módulo de API |
| **participantsApi** | Adaptador fetch para participantes: `getParticipants(opts)`, `createParticipant`. Timeout por defecto (3000ms), `AbortController`, cancelación por señal | Módulo de API |
| **registrationsApi** | Adaptador fetch para inscripciones: `register(eventId, participantId)`, `getAttendees(eventId)` | Módulo de API |

### 3.3 Patrones de Concurrencia

Dos mecanismos protegen contra condiciones de carrera en los dos flujos de lista asíncrona:

1. **Eventos:** `mutationRevision.useRef(0)` — se incrementa al crear/editar/eliminar. Una respuesta de lista anterior (cuyo `revision` no coincide con el actual) se descarta.
2. **Participantes:** `participantRevision.useRef(0)` — mismo patrón para el flujo de participantes.
3. **Asistentes:** `attendeeRevision` (estado, no ref) — se incrementa tras una inscripción exitosa, forzando la recarga de la lista de asistentes.

---

## 4. Integración con API REST

### 4.1 Endpoints

| Método | Ruta | Código de respuesta | Descripción |
|--------|------|--------------------|-------------|
| `GET` | `/api/health` | 200 | Health check: `{ status: "ok" }` |
| `GET` | `/api/events?search=` | 200 | Lista eventos. Filtro opcional por título/descripción/categoría/lugar |
| `GET` | `/api/events/:id` | 200 / 404 | Obtener un evento por ID |
| `POST` | `/api/events` | 201 / 400 | Crear evento. Requiere: title, description, date, location, category, capacity |
| `PUT` | `/api/events/:id` | 200 / 400 / 404 / 409 | Actualizar evento. 409 si la capacidad es menor que los inscritos |
| `DELETE` | `/api/events/:id` | 204 / 404 | Eliminar evento y sus inscripciones asociadas |
| `GET` | `/api/participants` | 200 | Listar todos los participantes |
| `POST` | `/api/participants` | 201 / 400 / 409 | Crear participante. 409 si el email ya existe |
| `POST` | `/api/events/:id/registrations` | 201 / 400 / 404 / 409 | Inscribir participante. 409 si duplicado o capacidad llena |
| `GET` | `/api/events/:id/attendees` | 200 / 404 | Listar asistentes de un evento con sus datos completos |

### 4.2 Contratos de Error

Todas las respuestas de error siguen el formato `{ error: "mensaje descriptivo" }`:

| Código HTTP | Causa | Ejemplo de mensaje |
|-------------|-------|-------------------|
| 400 | Validación de entrada fallida | `"title is required"` |
| 400 | Body no es objeto JSON | `"Request body must be a JSON object"` |
| 404 | Recurso no encontrado | `"Event not found"` |
| 409 | Conflicto de negocio | `"Email is already registered"`, `"Participant is already registered"`, `"Event capacity reached"`, `"Capacity cannot be lower than current registration count"` |
| 500 | Error interno del servidor | `"Internal server error"` |

### 4.3 Middleware de Error en Express

El backend utiliza una cadena de middleware de error que discrimina por tipo de excepción:

```
express.json parse error → 400 "Request body must be a JSON object"
ValidationError          → 400 con mensaje de validación
NotFoundError            → 404 con mensaje descriptivo
ConflictError            → 409 con mensaje descriptivo
Error genérico           → 500 "Internal server error"
```

### 4.4 Timeout y AbortController en el Cliente

Los adaptadores de API del frontend implementan:

- **Timeout por defecto** de 3000ms en `getParticipants()`. Si el servidor no responde en ese tiempo, la promesa se rechaza con `"Request timed out."`.
- **`AbortController`** interno con propagación de señal externa. Si el componente se desmonta durante una petición, la señal de `useEffect` (via `active` flag) cancela la petición.
- **Señal externa opcional** (`signal` en opciones) para control desde el llamador.
- **`timeoutMs: 0`** desactiva el timeout explícitamente.

---

## 5. Estrategia de Pruebas

### 5.1 Enfoque

El proyecto sigue la metodología **Strict TDD** (Test-Driven Development estricto):

1. **RED:** Escribir la prueba primero, verificar que falle (componente/función no existe)
2. **GREEN:** Implementación mínima para que la prueba pase
3. **REFACTOR:** Mejorar el código sin cambiar comportamiento, pruebas siguen verdes
4. **TRIANGULATE:** Casos adicionales para validar robustez (varios ejemplos de email, capacities, etc.)

### 5.2 Capas de Prueba

| Capa | Runner | Alcance | Cantidad |
|------|--------|---------|----------|
| **Unitaria (API adapters)** | Vitest | Contratos HTTP: método, headers, body, parseo, propagación de errores, timeout, cancelación | 18 (12 participantsApi + 6 registrationsApi) |
| **Integración (componentes)** | Vitest + React Testing Library | Renderizado de componentes con mocks de API inyectados por props, interacciones de usuario, flujos de estado | 49 (18 App + 15 ParticipantSection + 6 EnrollmentSection + 6 AttendeeSection + 4 StatusPanel) |
| **Integración (backend)** | Vitest + Supertest | Peticiones HTTP reales contra la app Express con base de datos temporal en `tmpdir()` | 12 (11 API + 1 repositorio) |

**Total: 79 pruebas (67 frontend + 12 backend).**

### 5.3 Ejemplos de Pruebas Representativas

| # | Tipo | Archivo | Prueba | Categoría |
|---|------|---------|--------|-----------|
| FE-01 | Frontend | `App.test.jsx` | "creates an event and adds it to the list" | Creación exitosa |
| FE-02 | Frontend | `App.test.jsx` | "searches through the API boundary" | Búsqueda con API |
| FE-03 | Frontend | `ParticipantSection.test.jsx` | "calls addParticipant with name and email" | Alta de participante |
| FE-04 | Frontend | `ParticipantSection.test.jsx` | "shows validation error for malformed email" | Validación cliente |
| FE-05 | Frontend | `EnrollmentSection.test.jsx` | "calls registerParticipant and shows success" | Inscripción exitosa |
| FE-06 | Frontend | `AttendeeSection.test.jsx` | "lists attendee names and emails" | Lista de asistentes |
| BE-01 | Backend | `app.test.js` | "searches events" | GET con filtro |
| BE-02 | Backend | `app.test.js` | "rejects invalid event data" | POST con validación |
| BE-03 | Backend | `app.test.js` | "creates and lists participants" | POST + GET participante |
| BE-04 | Backend | `app.test.js` | "prevents duplicate registrations" | POST con conflicto 409 |
| BE-05 | Backend | `app.test.js` | "rejects capacity below current registrations" | PUT con regla de negocio |
| BE-06 | Backend | `app.test.js` | "registers a participant and lists attendees" | POST + GET asistentes |

Las capturas de terminal de cada prueba se encuentran en `docs/evidence/` con su tabla de referencia en `docs/evidence/README.md`.

### 5.4 Patrones de Prueba Clave

- **Prop-injection para aislamiento:** Cada componente recibe sus dependencias como props con valores por defecto, permitiendo inyectar `vi.fn()` en pruebas sin mockear módulos globales.
- **`deferred()` para race conditions:** Las pruebas de concurrencia utilizan un helper `deferred()` que crea una promesa con `resolve` externo, permitiendo controlar el orden de resolución de respuestas asíncronas.
- **`vi.useFakeTimers()` para timeouts:** Las pruebas de timeout/cancelación usan timers falsos para validar comportamiento temporal de forma determinista sin esperas reales.
- **Base de datos temporal en backend:** Cada prueba de integración del backend crea una carpeta temporal única con `mkdtemp()` y un archivo `db.json` pre-poblado, garantizando aislamiento completo entre pruebas.
- **`allowOnly: false` en Vitest:** La configuración prohíbe `describe.only` / `it.only` para prevenir que pruebas enfocadas se cometan accidentalmente.

### 5.5 Suite Completa

```bash
npm test    # 79/79 passed (67 frontend + 12 backend)
npm run build  # Vite production build + backend syntax check — exit 0
```

---

## 6. Conclusión

AgendaU demuestra la integración full-stack de una aplicación web académica construida con principios de arquitectura limpia y desarrollo guiado por pruebas. La combinación de un frontend React con componentes inyectables por props, un backend Express con capas de servicio y repositorio separadas, y una suite de 79 pruebas con cobertura de estados de UI, flujos de negocio y condiciones de borde, constituye un entregable sólido para el trabajo final de la materia.

Las decisiones técnicas clave — monorepo con npm workspaces, persistencia JSON con escritura serializada, patrón prop-injection para testeabilidad, Strict TDD con 67 pruebas de frontend y 12 de backend, y manejo explícito de timeout/cancelación en los adaptadores de API — reflejan una comprensión integral del desarrollo web moderno aplicado a un caso de uso real: la gestión de eventos y participantes en un entorno universitario.
