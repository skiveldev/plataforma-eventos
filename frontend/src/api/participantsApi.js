const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const DEFAULT_TIMEOUT_MS = 3000;

export async function getParticipants({ signal, timeoutMs } = {}) {
  let timeoutId;
  const controller = new AbortController();

  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const effectiveTimeout = timeoutMs !== undefined ? timeoutMs : DEFAULT_TIMEOUT_MS;
  if (effectiveTimeout) {
    timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);
  }

  try {
    const response = await fetch(`${baseUrl}/participants`, { signal: controller.signal });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'Could not load participants. Please try again.');
    }
    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function mutateParticipant(path, options) {
  const response = await fetch(`${baseUrl}${path}`, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Could not save the participant. Please try again.');
  }
  return response.json();
}

export async function createParticipant({ name, email, signal, timeoutMs } = {}) {
  let timeoutId;
  const controller = new AbortController();

  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const effectiveTimeout = timeoutMs !== undefined ? timeoutMs : DEFAULT_TIMEOUT_MS;
  if (effectiveTimeout) {
    timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);
  }

  try {
    return await mutateParticipant('/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
