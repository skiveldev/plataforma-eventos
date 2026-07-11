import cors from 'cors';
import express from 'express';
import { ConflictError, NotFoundError } from './services/agendaService.js';
import { ValidationError, requireFields } from './validation.js';

export function createApp(service, { origin = 'http://localhost:5173' } = {}) {
  const app = express();
  app.use(cors({ origin }));
  app.use(express.json());
  app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));
  app.get('/api/events', async (request, response) => response.json(await service.listEvents(request.query.search)));
  app.get('/api/events/:id', async (request, response) => response.json(await service.getEvent(request.params.id)));
  app.post('/api/events', async (request, response) => response.status(201).json(await service.createEvent(request.body)));
  app.put('/api/events/:id', async (request, response) => response.json(await service.updateEvent(request.params.id, request.body)));
  app.delete('/api/events/:id', async (request, response) => { await service.deleteEvent(request.params.id); response.status(204).end(); });
  app.get('/api/participants', async (_request, response) => response.json(await service.listParticipants()));
  app.post('/api/participants', async (request, response) => response.status(201).json(await service.createParticipant(request.body)));
  app.post('/api/events/:id/registrations', async (request, response) => { requireFields(request.body, ['participantId']); response.status(201).json(await service.register(request.params.id, request.body.participantId)); });
  app.get('/api/events/:id/attendees', async (request, response) => response.json(await service.listAttendees(request.params.id)));
  app.use((_request, response) => response.status(404).json({ error: 'Route not found' }));
  app.use((error, _request, response, _next) => {
    if (error.type === 'entity.parse.failed' && error.status === 400) return response.status(400).json({ error: 'Request body must be a JSON object' });
    if (error instanceof ValidationError) return response.status(400).json({ error: error.message });
    if (error instanceof NotFoundError) return response.status(404).json({ error: error.message });
    if (error instanceof ConflictError) return response.status(409).json({ error: error.message });
    console.error(error);
    return response.status(500).json({ error: 'Internal server error' });
  });
  return app;
}
