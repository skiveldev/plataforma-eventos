const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function getEvents(search = '') {
  const response = await fetch(`${baseUrl}/events?search=${encodeURIComponent(search)}`);
  if (!response.ok) throw new Error('Could not load events. Please try again.');
  return response.json();
}

async function mutateEvent(path, options) {
  const response = await fetch(`${baseUrl}${path}`, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Could not save the event. Please try again.');
  }
  return response.status === 204 ? null : response.json();
}

export function createEvent(event) {
  return mutateEvent('/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(event) });
}

export function updateEvent(id, event) {
  return mutateEvent(`/events/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(event) });
}

export function deleteEvent(id) {
  return mutateEvent(`/events/${id}`, { method: 'DELETE' });
}
