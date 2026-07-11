import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { createJsonRepository } from '../src/repository/jsonRepository.js';
import { createAgendaService } from '../src/services/agendaService.js';

let app;
beforeEach(async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'agendau-'));
  const file = path.join(directory, 'db.json');
  await writeFile(file, JSON.stringify({ events: [{ id: 'event-1', title: 'Testing Workshop', description: 'Learn tests', date: '2026-09-01T10:00:00.000Z', location: 'Lab', category: 'Workshop', capacity: 1 }], participants: [{ id: 'person-1', name: 'Sam Lee', email: 'sam@example.edu' }], registrations: [] }));
  app = createApp(createAgendaService(createJsonRepository(file)));
});

describe('AgendaU API', () => {
  it('reports health', async () => expect((await request(app).get('/api/health')).body).toEqual({ status: 'ok' }));
  it('searches events', async () => expect((await request(app).get('/api/events?search=testing')).body).toHaveLength(1));
  it('creates a valid event', async () => {
    const response = await request(app).post('/api/events').send({ title: 'Talk', description: 'A talk', date: '2026-10-01', location: 'Hall', category: 'Talk', capacity: 20 });
    expect(response.status).toBe(201); expect(response.body.id).toBeTruthy();
  });
  it('rejects invalid event data', async () => expect((await request(app).post('/api/events').send({ title: 'Incomplete' })).status).toBe(400));
  it.each([null, []])('rejects a non-object JSON body: %j', async (body) => {
    const response = await request(app).post('/api/events').set('Content-Type', 'application/json').send(JSON.stringify(body));
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Request body must be a JSON object' });
  });
  it('creates and lists participants', async () => {
    expect((await request(app).post('/api/participants').send({ name: 'Taylor Kim', email: 'taylor@example.edu' })).status).toBe(201);
    expect((await request(app).get('/api/participants')).body).toHaveLength(2);
  });
  it('registers a participant and lists attendees', async () => {
    expect((await request(app).post('/api/events/event-1/registrations').send({ participantId: 'person-1' })).status).toBe(201);
    expect((await request(app).get('/api/events/event-1/attendees')).body[0].email).toBe('sam@example.edu');
  });
  it('prevents duplicate registrations', async () => {
    await request(app).post('/api/events/event-1/registrations').send({ participantId: 'person-1' });
    expect((await request(app).post('/api/events/event-1/registrations').send({ participantId: 'person-1' })).status).toBe(409);
  });
  it('rejects capacity below the current registration count', async () => {
    const capacityTwo = { title: 'Updated', description: 'Updated event', date: '2026-11-01', location: 'Room 1', category: 'Seminar', capacity: 2 };
    await request(app).put('/api/events/event-1').send(capacityTwo);
    const participant = (await request(app).post('/api/participants').send({ name: 'Taylor Kim', email: 'taylor@example.edu' })).body;
    await request(app).post('/api/events/event-1/registrations').send({ participantId: 'person-1' });
    await request(app).post('/api/events/event-1/registrations').send({ participantId: participant.id });
    const event = { ...capacityTwo, capacity: 1 };
    const response = await request(app).put('/api/events/event-1').send(event);
    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: 'Capacity cannot be lower than current registration count' });
  });
  it('updates and deletes events', async () => {
    const event = { title: 'Updated', description: 'Updated event', date: '2026-11-01', location: 'Room 1', category: 'Seminar', capacity: 5 };
    expect((await request(app).put('/api/events/event-1').send(event)).body.title).toBe('Updated');
    expect((await request(app).delete('/api/events/event-1')).status).toBe(204);
    expect((await request(app).get('/api/events/event-1')).status).toBe(404);
  });
});
