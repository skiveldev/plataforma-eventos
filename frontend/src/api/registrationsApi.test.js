import { afterEach, describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line import/named
import { getAttendees, register } from './registrationsApi.js';

describe('registrationsApi', () => {
  afterEach(() => vi.restoreAllMocks());

  describe('register', () => {
    it('sends POST to /api/events/:id/registrations with participantId in body', async () => {
      const mockResponse = { id: 'reg-1', eventId: 'ev-1', participantId: 'p-1', createdAt: '2026-07-11T00:00:00.000Z' };
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: () => Promise.resolve(mockResponse) });

      const result = await register('ev-1', 'p-1');

      expect(result).toEqual(mockResponse);
      const [url, options] = fetch.mock.calls[0];
      expect(url).toContain('/events/ev-1/registrations');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(JSON.parse(options.body)).toEqual({ participantId: 'p-1' });
    });

    it('throws error from backend response body on failure', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ error: 'Participant is already registered' }),
      });

      await expect(register('ev-1', 'p-1')).rejects.toThrow('Participant is already registered');
    });

    it('throws a generic error message when the response body has no error field', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) });

      await expect(register('ev-1', 'p-1')).rejects.toThrow(/Could not/);
    });
  });

  describe('getAttendees', () => {
    it('fetches attendees from GET /api/events/:id/attendees', async () => {
      const attendees = [{ id: 'p-1', name: 'Sam', email: 'sam@example.edu' }];
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: () => Promise.resolve(attendees) });

      const result = await getAttendees('ev-1');

      expect(result).toEqual(attendees);
      expect(fetch.mock.calls[0][0]).toContain('/events/ev-1/attendees');
    });

    it('throws error from backend response body on failure', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Event not found' }),
      });

      await expect(getAttendees('ev-1')).rejects.toThrow('Event not found');
    });

    it('throws a generic error when response body has no error field', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) });

      await expect(getAttendees('ev-1')).rejects.toThrow(/Could not/);
    });
  });
});
