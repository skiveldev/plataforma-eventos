import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AttendeeSection from './AttendeeSection.jsx';

const participant = { id: 'p-1', name: 'Alice Rivera', email: 'alice@example.com' };
const participant2 = { id: 'p-2', name: 'Bob Chen', email: 'bob@example.com' };

describe('AttendeeSection', () => {
  // 3.7: loading state on mount
  it('shows a loading state on mount', () => {
    render(
      <AttendeeSection
        eventId="ev-1"
        loadAttendees={() => new Promise(() => {})}
      />
    );
    expect(screen.getByRole('status')).toHaveTextContent('Cargando');
  });

  // 3.8: empty message when no registrations
  it('displays an empty message when no registrations exist', async () => {
    render(
      <AttendeeSection
        eventId="ev-1"
        loadAttendees={() => Promise.resolve([])}
      />
    );
    expect(await screen.findByText(/asistentes/)).toBeVisible();
  });

  // 3.9: list attendee names/emails on successful load
  it('lists attendee names and emails on successful load', async () => {
    render(
      <AttendeeSection
        eventId="ev-1"
        loadAttendees={() => Promise.resolve([participant, participant2])}
      />
    );
    expect(await screen.findByText(participant.name)).toBeVisible();
    expect(screen.getByText(participant.email)).toBeVisible();
    expect(screen.getByText(participant2.name)).toBeVisible();
    expect(screen.getByText(participant2.email)).toBeVisible();
  });

  // 3.10: error state when getAttendees throws
  it('shows an error state when loadAttendees throws', async () => {
    render(
      <AttendeeSection
        eventId="ev-1"
        loadAttendees={() => Promise.reject(new Error('Network failure'))}
      />
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('Network failure');
  });

  // RESILIENCE-003-1: retry button visible in error state
  it('shows a retry button when attendee load fails', async () => {
    render(
      <AttendeeSection
        eventId="ev-1"
        loadAttendees={() => Promise.reject(new Error('Network failure'))}
      />
    );
    await screen.findByRole('alert');
    expect(
      screen.getByRole('button', { name: /reintentar/i })
    ).toBeVisible();
  });

  // RESILIENCE-003-2: retry button click re-triggers loadAttendees
  it('calls loadAttendees again when retry button is clicked', async () => {
    const loadAttendees = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network failure'))
      .mockResolvedValueOnce([participant]);

    render(
      <AttendeeSection
        eventId="ev-1"
        loadAttendees={loadAttendees}
      />
    );
    await screen.findByRole('alert');

    fireEvent.click(
      screen.getByRole('button', { name: /reintentar/i })
    );

    await waitFor(() => expect(loadAttendees).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(participant.name)).toBeVisible();
  });
});
