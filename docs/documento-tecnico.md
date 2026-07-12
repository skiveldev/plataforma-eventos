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
| Pruebas | Pruebas funcionales manuales | Práctica 8, Parte 9 |
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
│   ├── vite.config.js             # Configuración de Vite
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
    ├── capturas/
    │   ├── frontend/              # Capturas del navegador de las pruebas manuales
    │   └── backend/               # Capturas de PowerShell y transcriptos de API
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

Esta separación permite verificar cada flujo de la interfaz de forma aislada y mantener desacoplada la comunicación con la API.

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

## 5. Pruebas Funcionales Manuales

### 5.1 Enfoque

Las pruebas se realizan manualmente siguiendo el formato de la Práctica 8, Parte 9. Se verifica el comportamiento observable de la interfaz en un navegador y de la API REST desde PowerShell. Cada caso requiere una captura de su ejecución: navegador para frontend y terminal PowerShell para backend.

Las imágenes se deben almacenar en `docs/capturas/frontend/` y `docs/capturas/backend/`. Los transcriptos de PowerShell complementan la evidencia del backend, pero no reemplazan las capturas de terminal requeridas.

### 5.2 Casos de Prueba del Frontend

| Prueba | Función/Acción | Entrada/Datos | Resultado esperado | Evidencia |
|---------|----------------|---------------|--------------------|-----------|
| FE-01 Obtener eventos | Abrir AgendaU y visualizar la sección de eventos. | Aplicación con API disponible. | Se muestra la lista de eventos disponibles o el estado vacío correspondiente. | `docs/capturas/frontend/fe-01-obtener-eventos.png` (pendiente) |

| Prueba | Función/Acción | Entrada/Datos | Resultado esperado | Evidencia |
|---------|----------------|---------------|--------------------|-----------|
| FE-02 Crear evento | Completar el formulario y seleccionar «Crear evento». | Título, descripción, fecha válida, ubicación, categoría y capacidad positiva. | Se informa la creación exitosa y el evento aparece en la lista. | `docs/capturas/frontend/fe-02-crear-evento.png` (pendiente) |

| Prueba | Función/Acción | Entrada/Datos | Resultado esperado | Evidencia |
|---------|----------------|---------------|--------------------|-----------|
| FE-03 Editar evento | Seleccionar «Editar», modificar datos y guardar. | Evento existente; nueva ubicación o capacidad válida. | Se informa la actualización exitosa y la tarjeta muestra los datos modificados. | `docs/capturas/frontend/fe-03-editar-evento.png` (pendiente) |

| Prueba | Función/Acción | Entrada/Datos | Resultado esperado | Evidencia |
|---------|----------------|---------------|--------------------|-----------|
| FE-04 Eliminar evento | Seleccionar «Eliminar» y confirmar la operación. | Evento de prueba existente. | Se informa la eliminación exitosa y el evento deja de figurar en la lista. | `docs/capturas/frontend/fe-04-eliminar-evento.png` (pendiente) |

| Prueba | Función/Acción | Entrada/Datos | Resultado esperado | Evidencia |
|---------|----------------|---------------|--------------------|-----------|
| FE-05 Registrar participante | Completar el formulario de participantes y enviar. | Nombre y correo electrónico válidos. | El participante se incorpora al listado y se informa el registro exitoso. | `docs/capturas/frontend/fe-05-registrar-participante.png` (pendiente) |

| Prueba | Función/Acción | Entrada/Datos | Resultado esperado | Evidencia |
|---------|----------------|---------------|--------------------|-----------|
| FE-06 Inscribir participante y consultar asistentes | Seleccionar un evento y un participante; inscribir y consultar asistentes. | Evento y participante existentes. | Se informa la inscripción exitosa y el participante se muestra en la lista de asistentes del evento seleccionado. | `docs/capturas/frontend/fe-06-inscribir-y-consultar-asistentes.png` (pendiente) |

### 5.3 Casos de Prueba del Backend

| Prueba | Endpoint/Método | Entrada/Datos | Resultado esperado | Evidencia |
|---------|-----------------|---------------|--------------------|-----------|
| BE-01 Consultar eventos | `GET /api/events` | Sin cuerpo. | Respuesta `200` con una colección JSON de eventos. | `docs/capturas/backend/be-01-consultar-eventos.png` (pendiente) |

| Prueba | Endpoint/Método | Entrada/Datos | Resultado esperado | Evidencia |
|---------|-----------------|---------------|--------------------|-----------|
| BE-02 Registrar evento | `POST /api/events` | Evento con todos los campos requeridos y capacidad positiva. | Respuesta `201` con el evento creado. | `docs/capturas/backend/be-02-registrar-evento.png` (pendiente) |

| Prueba | Endpoint/Método | Entrada/Datos | Resultado esperado | Evidencia |
|---------|-----------------|---------------|--------------------|-----------|
| BE-03 Actualizar evento | `PUT /api/events/:id` | Identificador del evento creado y datos válidos actualizados. | Respuesta `200` con los datos actualizados. | `docs/capturas/backend/be-03-actualizar-evento.png` (pendiente) |

| Prueba | Endpoint/Método | Entrada/Datos | Resultado esperado | Evidencia |
|---------|-----------------|---------------|--------------------|-----------|
| BE-04 Eliminar evento | `DELETE /api/events/:id` | Identificador del evento de prueba. | Respuesta `204`; el recurso se elimina. | `docs/capturas/backend/be-04-eliminar-evento.png` (pendiente) |

| Prueba | Endpoint/Método | Entrada/Datos | Resultado esperado | Evidencia |
|---------|-----------------|---------------|--------------------|-----------|
| BE-05 Registrar participante | `POST /api/participants` | Nombre y correo electrónico únicos y válidos. | Respuesta `201` con el participante creado. | `docs/capturas/backend/be-05-registrar-participante.png` (pendiente) |

| Prueba | Endpoint/Método | Entrada/Datos | Resultado esperado | Evidencia |
|---------|-----------------|---------------|--------------------|-----------|
| BE-06 Inscribir participante y consultar asistentes | `POST /api/events/:id/registrations` y `GET /api/events/:id/attendees` | Identificadores de evento y participante creados para la prueba. | Respuestas `201` y `200`; la lista de asistentes incluye al participante inscrito. | `docs/capturas/backend/be-06-inscribir-y-consultar-asistentes.png` (pendiente) |

### 5.4 Estado de la Evidencia

Al momento de actualizar este documento, no se generaron imágenes de evidencia. Las pruebas frontend requieren capturas reales del navegador. Las pruebas backend requieren capturas reales de una ventana de PowerShell. El backend no estaba ejecutándose en `http://localhost:3001`; por ello, se preparó el script `docs/capturas/backend/ejecutar-pruebas-backend.ps1` para ejecutarlas posteriormente y producir los transcriptos verificables.

---

## 6. Conclusión

AgendaU demuestra la integración full-stack de una aplicación web académica construida con principios de arquitectura limpia. La combinación de un frontend React con componentes inyectables por props, un backend Express con capas de servicio y repositorio separadas, y un plan de pruebas funcionales manuales sobre los flujos principales, constituye un entregable sólido para el trabajo final de la materia.

Las decisiones técnicas clave — monorepo con npm workspaces, persistencia JSON con escritura serializada, patrón prop-injection, pruebas funcionales manuales de frontend y backend, y manejo explícito de timeout/cancelación en los adaptadores de API — reflejan una comprensión integral del desarrollo web moderno aplicado a un caso de uso real: la gestión de eventos y participantes en un entorno universitario.
