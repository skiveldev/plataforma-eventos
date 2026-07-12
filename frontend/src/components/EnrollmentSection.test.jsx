import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EnrollmentSection from './EnrollmentSection.jsx';

const event = { id: 'ev-1', title: 'Workshop', capacity: 30 };
const event2 = { id: 'ev-2', title: 'Seminar', capacity: 5 };
const participant = { id: 'p-1', name: 'Alice Rivera', email: 'alice@example.com' };
const participant2 = { id: 'p-2', name: 'Bob Chen', email: 'bob@example.com' };

describe('EnrollmentSection', () => {
  // 3.1: renders event selector + participant selector + submit button
  it('renders event selector, participant selector, and submit button', () => {
    render(
      <EnrollmentSection
        events={[event]}
        participants={[participant]}
        registerParticipant={() => {}}
      />
    );

    expect(screen.getByRole('combobox', { name: /evento/i })).toBeVisible();
    expect(screen.getByRole('combobox', { name: /participante/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /inscribir/i })).toBeVisible();
  });

  // 3.2: successful enrollment
  it('calls registerParticipant with selected event and participant and shows success', async () => {
    const registerParticipant = vi.fn().mockResolvedValue({ id: 'reg-1' });
    render(
      <EnrollmentSection
        events={[event]}
        participants={[participant]}
        registerParticipant={registerParticipant}
      />
    );

    fireEvent.change(screen.getByRole('combobox', { name: /evento/i }), { target: { value: event.id } });
    fireEvent.change(screen.getByRole('combobox', { name: /participante/i }), { target: { value: participant.id } });
    fireEvent.click(screen.getByRole('button', { name: /inscribir/i }));

    await waitFor(() =>
      expect(registerParticipant).toHaveBeenCalledWith(event.id, participant.id)
    );
    expect(await screen.findByRole('status')).toHaveTextContent(/exitosa/i);
  });

  // 3.3: duplicate enrollment error (409)
  it('shows "Participant is already registered" on duplicate enrollment', async () => {
    const registerParticipant = vi.fn().mockRejectedValue(new Error('Participant is already registered'));
    render(
      <EnrollmentSection
        events={[event]}
        participants={[participant]}
        registerParticipant={registerParticipant}
      />
    );

    fireEvent.change(screen.getByRole('combobox', { name: /evento/i }), { target: { value: event.id } });
    fireEvent.change(screen.getByRole('combobox', { name: /participante/i }), { target: { value: participant.id } });
    fireEvent.click(screen.getByRole('button', { name: /inscribir/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Participant is already registered');
  });

  // 3.4: capacity reached error (409)
  it('shows "Event capacity reached" when enrollment fails due to capacity', async () => {
    const registerParticipant = vi.fn().mockRejectedValue(new Error('Event capacity reached'));
    render(
      <EnrollmentSection
        events={[event]}
        participants={[participant]}
        registerParticipant={registerParticipant}
      />
    );

    fireEvent.change(screen.getByRole('combobox', { name: /evento/i }), { target: { value: event.id } });
    fireEvent.change(screen.getByRole('combobox', { name: /participante/i }), { target: { value: participant.id } });
    fireEvent.click(screen.getByRole('button', { name: /inscribir/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Event capacity reached');
  });

  // 3.5: missing resource error (404)
  it('shows API error message on missing resource', async () => {
    const registerParticipant = vi.fn().mockRejectedValue(new Error('Event not found'));
    render(
      <EnrollmentSection
        events={[event]}
        participants={[participant]}
        registerParticipant={registerParticipant}
      />
    );

    fireEvent.change(screen.getByRole('combobox', { name: /evento/i }), { target: { value: event.id } });
    fireEvent.change(screen.getByRole('combobox', { name: /participante/i }), { target: { value: participant.id } });
    fireEvent.click(screen.getByRole('button', { name: /inscribir/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Event not found');
  });

  // 3.6: receives events and participants as props (no internal fetch)
  it('renders events passed as props in the event selector', () => {
    render(
      <EnrollmentSection
        events={[event, event2]}
        participants={[participant, participant2]}
        registerParticipant={() => {}}
      />
    );

    const eventSelect = screen.getByRole('combobox', { name: /evento/i });
    expect(eventSelect.children).toHaveLength(3); // default option + 2 events
    expect(screen.getByText(event.title)).toBeVisible();
    expect(screen.getByText(event2.title)).toBeVisible();

    const participantSelect = screen.getByRole('combobox', { name: /participante/i });
    expect(participantSelect.children).toHaveLength(3); // default option + 2 participants
    expect(screen.getByText(participant.name)).toBeVisible();
    expect(screen.getByText(participant2.name)).toBeVisible();
  });
});
