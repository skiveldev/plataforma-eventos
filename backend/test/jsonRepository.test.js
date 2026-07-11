import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';
import { createJsonRepository } from '../src/repository/jsonRepository.js';

it('serializes concurrent read-modify-write updates', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'agendau-repository-'));
  const file = path.join(directory, 'db.json');
  await writeFile(file, JSON.stringify({ events: [], participants: [], registrations: [] }));
  const repository = createJsonRepository(file);

  await Promise.all([
    repository.update((data) => data.events.push({ id: 'event-1' })),
    repository.update((data) => data.events.push({ id: 'event-2' }))
  ]);

  expect(JSON.parse(await readFile(file, 'utf8')).events).toEqual([
    { id: 'event-1' },
    { id: 'event-2' }
  ]);
});
