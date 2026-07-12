# AgendaU — Plataforma de Eventos Académicos

Proyecto universitario individual para descubrir y gestionar eventos académicos. Aplicación React 19 de una sola página y API REST con Express 5, respaldada por un archivo JSON local, organizado como monorepo npm.

## Requisitos

- Node.js 20 o superior
- npm 10 o superior

## Inicio rápido

```bash
npm install
npm run dev:backend   # → http://localhost:3001
npm run dev:frontend  # → http://localhost:5173
```

El frontend se comunica directamente con la API REST mediante fetch.

## Verificación

```bash
npm test              # vitest (67 frontend + 12 backend) — 79 pruebas
npm run build         # build de producción Vite + verificación de sintaxis del backend
```

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, Vite 7, Vitest + Testing Library |
| Backend | Express 5, validación personalizada, supertest |
| Persistencia | Archivo JSON con lectura/escritura serializada |
| Herramientas | npm workspaces |

## Estructura

```
backend/
├── src/
│   ├── app.js              # Aplicación Express + rutas REST
│   ├── server.js           # Punto de entrada (puerto 3001)
│   ├── services/           # Lógica de dominio
│   ├── repository/         # Lectura/escritura del archivo JSON
│   ├── validation.js       # Validación de campos
│   └── data/               # Base de datos db.json
└── test/
    ├── app.test.js          # 11 pruebas de integración (supertest)
    └── jsonRepository.test.js  # 1 prueba unitaria

frontend/
├── src/
│   ├── App.jsx              # Página principal con secciones
│   ├── EventForm.jsx        # Formulario reutilizable de eventos
│   ├── main.jsx             # Entrada de React DOM
│   ├── api/                 # Adaptadores fetch (eventos, participantes, inscripciones)
│   ├── components/          # Secciones: participantes, inscripción, asistentes
│   ├── styles.css           # Estilos responsive con sistema de diseño
│   └── test/setup.js        # Configuración de jsdom + Testing Library
└── App.test.jsx             # Pruebas de integración

docs/                        # Entregables del proyecto (documento técnico y evidencias)
```

El almacenamiento en JSON es adecuado para trabajos académicos y desarrollo local, pero no está diseñado para escrituras concurrentes en producción.
