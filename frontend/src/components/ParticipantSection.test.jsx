import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ParticipantSection from './ParticipantSection.jsx';

const participant = { id: 'p1', name: 'Alice Rivera', email: 'alice@example.com' };
const participant2 = { id: 'p2', name: 'Bob Chen', email: 'bob@example.com' };

function deferred() {
  let resolve;
  const promise = new Promise((settle) => { resolve = settle; });
  return { promise, resolve };
}

describe('ParticipantSection', () => {
  // 2.3: loading state on mount
  it('shows a loading state on mount', () => {
    render(
      <ParticipantSection
        loadParticipants={() => new Promise(() => {})}
        addParticipant={() => {}}
      />
    );
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
  });

  // 2.4: empty state
  it('displays an empty message when the participant list is empty', async () => {
    render(
      <ParticipantSection
        loadParticipants={() => Promise.resolve([])}
        addParticipant={() => {}}
      />
    );
    expect(await screen.findByText(/No participants/)).toBeVisible();
  });

  // 2.5: successful list
  it('lists participant names and emails on successful load', async () => {
    render(
      <ParticipantSection
        loadParticipants={() => Promise.resolve([participant, participant2])}
        addParticipant={() => {}}
      />
    );
    expect(await screen.findByText(participant.name)).toBeVisible();
    expect(screen.getByText(participant.email)).toBeVisible();
    expect(screen.getByText(participant2.name)).toBeVisible();
    expect(screen.getByText(participant2.email)).toBeVisible();
  });

  // 2.6: API error
  it('shows an error state when getParticipants throws', async () => {
    render(
      <ParticipantSection
        loadParticipants={() => Promise.reject(new Error('Network failure'))}
        addParticipant={() => {}}
      />
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('Network failure');
  });

  // 2.7: form submission calls addParticipant
  it('calls addParticipant with name and email on form submission', async () => {
    const addParticipant = vi.fn().mockResolvedValue(participant);
    render(
      <ParticipantSection
        loadParticipants={() => Promise.resolve([])}
        addParticipant={addParticipant}
      />
    );
    await screen.findByText(/No participants/);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice Rivera' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alice@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Add participant/i }));

    await waitFor(() =>
      expect(addParticipant).toHaveBeenCalledWith({
        name: 'Alice Rivera',
        email: 'alice@example.com',
      })
    );
  });

  // 2.8: form clears + list updates on success
  it('clears the form and adds the new participant to the list after successful creation', async () => {
    const created = { id: 'p3', name: 'Carlos Diaz', email: 'carlos@example.com' };
    const addParticipant = vi.fn().mockResolvedValue(created);
    render(
      <ParticipantSection
        loadParticipants={() => Promise.resolve([])}
        addParticipant={addParticipant}
      />
    );
    await screen.findByText(/No participants/);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Carlos Diaz' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'carlos@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Add participant/i }));

    expect(await screen.findByText('Carlos Diaz')).toBeVisible();
    expect(screen.getByLabelText('Name')).toHaveValue('');
    expect(screen.getByLabelText('Email')).toHaveValue('');
  });

  // 2.9: duplicate email (409) preserves fields
  it('preserves form fields and shows the error message on duplicate email', async () => {
    const addParticipant = vi.fn().mockRejectedValue(new Error('Email is already registered'));
    render(
      <ParticipantSection
        loadParticipants={() => Promise.resolve([participant])}
        addParticipant={addParticipant}
      />
    );
    await screen.findByText(participant.name);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice Rivera' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alice@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Add participant/i }));

    expect(await screen.findByText('Email is already registered')).toBeVisible();
    expect(screen.getByLabelText('Name')).toHaveValue('Alice Rivera');
    expect(screen.getByLabelText('Email')).toHaveValue('alice@example.com');
  });

  // 2.10: race-condition guard
  it('does not let an older list response overwrite a successful create', async () => {
    const list = deferred();
    const loadParticipants = vi.fn(() => list.promise);
    const created = { id: 'p3', name: 'Diana Vega', email: 'diana@example.com' };
    render(
      <ParticipantSection
        loadParticipants={loadParticipants}
        addParticipant={() => Promise.resolve(created)}
      />
    );

    await waitFor(() => expect(loadParticipants).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Diana Vega' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'diana@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Add participant/i }));

    expect(await screen.findByText('Diana Vega')).toBeVisible();

    list.resolve([participant]);

    // The created participant MUST still be visible — stale response discarded
    expect(screen.getByText('Diana Vega')).toBeVisible();
    expect(screen.queryByText(participant.name)).not.toBeInTheDocument();
  });

  // RELIABILITY-002: whitespace-only name must show validation error and NOT call addParticipant
  it('shows validation error and does not call addParticipant for whitespace-only name', async () => {
    const addParticipant = vi.fn();
    render(
      <ParticipantSection
        loadParticipants={() => Promise.resolve([])}
        addParticipant={addParticipant}
      />
    );
    await screen.findByText(/No participants/);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '   ' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alice@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Add participant/i }));

    expect(addParticipant).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/name/i);
  });

  // RELIABILITY-002: whitespace-only email must show validation error and NOT call addParticipant
  it('shows validation error and does not call addParticipant for whitespace-only email', async () => {
    const addParticipant = vi.fn();
    render(
      <ParticipantSection
        loadParticipants={() => Promise.resolve([])}
        addParticipant={addParticipant}
      />
    );
    await screen.findByText(/No participants/);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: '    ' } });
    fireEvent.click(screen.getByRole('button', { name: /Add participant/i }));

    expect(addParticipant).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/email/i);
  });

  // RELIABILITY-002: malformed email must show validation error and NOT call addParticipant
  it('shows validation error and does not call addParticipant for malformed email', async () => {
    const addParticipant = vi.fn();
    render(
      <ParticipantSection
        loadParticipants={() => Promise.resolve([])}
        addParticipant={addParticipant}
      />
    );
    await screen.findByText(/No participants/);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'not-an-email' } });
    fireEvent.click(screen.getByRole('button', { name: /Add participant/i }));

    expect(addParticipant).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/valid email/i);
  });

  // RELIABILITY-002: valid email with @ and domain calls addParticipant (triangulation)
  it('calls addParticipant for a valid email format', async () => {
    const addParticipant = vi.fn().mockResolvedValue({ id: 'p4', name: 'Alice', email: 'alice@example.com' });
    render(
      <ParticipantSection
        loadParticipants={() => Promise.resolve([])}
        addParticipant={addParticipant}
      />
    );
    await screen.findByText(/No participants/);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alice@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Add participant/i }));

    await waitFor(() =>
      expect(addParticipant).toHaveBeenCalledWith({
        name: 'Alice',
        email: 'alice@example.com',
      })
    );
  });

  // RESILIENCE-001-3: component shows controlled error when load times out
  it('shows an error when participant load times out', async () => {
    render(
      <ParticipantSection
        loadParticipants={() =>
          Promise.reject(new Error('Request timed out. Please try again.'))
        }
        addParticipant={() => {}}
      />
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(/timed out/i);
  });

  // RESILIENCE-002-1: retry button visible in error state
  it('shows a retry button when participant load fails', async () => {
    render(
      <ParticipantSection
        loadParticipants={() => Promise.reject(new Error('Network failure'))}
        addParticipant={() => {}}
      />
    );
    await screen.findByRole('alert');
    expect(
      screen.getByRole('button', { name: /retry|reload|try again/i })
    ).toBeVisible();
  });

  // RESILIENCE-002-2: retry button calls loadParticipants again
  it('calls loadParticipants again when retry button is clicked', async () => {
    const loadParticipants = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network failure'))
      .mockResolvedValueOnce([participant]);

    render(
      <ParticipantSection
        loadParticipants={loadParticipants}
        addParticipant={() => {}}
      />
    );
    await screen.findByRole('alert');

    fireEvent.click(
      screen.getByRole('button', { name: /retry|reload|try again/i })
    );

    await waitFor(() => expect(loadParticipants).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(participant.name)).toBeVisible();
  });
});
