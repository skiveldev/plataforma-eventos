import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const emptyDatabase = { events: [], participants: [], registrations: [] };

export function createJsonRepository(filePath) {
  let writes = Promise.resolve();

  async function write(data) {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
  }

  async function read() {
    try {
      return JSON.parse(await readFile(filePath, 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await write(emptyDatabase);
      return structuredClone(emptyDatabase);
    }
  }

  function save(data) {
    writes = writes.then(() => write(data));
    return writes;
  }

  function update(change) {
    const transaction = writes.then(async () => {
      const data = await read();
      const result = change(data);
      await write(data);
      return result;
    });
    writes = transaction.then(() => undefined, () => undefined);
    return transaction;
  }

  return { read, update };
}
