import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { createJsonRepository } from './repository/jsonRepository.js';
import { createAgendaService } from './services/agendaService.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
const repository = createJsonRepository(process.env.DATA_FILE || path.join(directory, 'data', 'db.json'));
const port = Number(process.env.PORT || 3001);

createApp(createAgendaService(repository), { origin: process.env.CORS_ORIGIN }).listen(port, () => {
  console.log(`AgendaU API listening on http://localhost:${port}`);
});
