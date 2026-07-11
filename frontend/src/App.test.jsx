import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App.jsx';

const event = { id: '1', title: 'Accessibility Workshop', description: 'Build inclusive apps', date: '2026-08-14', location: 'Lab 2', category: 'Workshop', capacity: 30 };

describe('App', () => {
  it('shows a loading state', () => { render(<App loadEvents={() => new Promise(() => {})} loadParticipants={() => new Promise(() => {})} />); expect(screen.getByText('Loading events...')).toBeVisible(); });
  it('renders loaded events', async () => { render(<App loadEvents={() => Promise.resolve([event])} loadParticipants={() => Promise.resolve([])} />); expect(await screen.findByText(event.title)).toBeVisible(); });
  it('shows an empty state', async () => { render(<App loadEvents={() => Promise.resolve([])} loadParticipants={() => Promise.resolve([])} />); expect(await screen.findByText(/No events match/)).toBeVisible(); });
  it('shows an error state', async () => { render(<App loadEvents={() => Promise.reject(new Error('offline'))} loadParticipants={() => Promise.resolve([])} />); expect(await screen.findByRole('alert')).toBeVisible(); });
  it('searches through the API boundary', async () => {
    const loadEvents = vi.fn().mockResolvedValue([event]); render(<App loadEvents={loadEvents} loadParticipants={() => Promise.resolve([])} />);
    await screen.findByText(event.title); fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'accessibility' } });
    await waitFor(() => expect(loadEvents).toHaveBeenLastCalledWith('accessibility'));
  });
  it('presents event details', async () => { render(<App loadEvents={() => Promise.resolve([event])} loadParticipants={() => Promise.resolve([])} />); expect(await screen.findByText('30 places')).toBeVisible(); expect(screen.getByText('Lab 2')).toBeVisible(); });
  it('creates an event and adds it to the list', async () => {
    const created = { ...event, id: '2', title: 'New Seminar' };
    const addEvent = vi.fn().mockResolvedValue(created);
    render(<App loadEvents={() => Promise.resolve([])} loadParticipants={() => Promise.resolve([])} addEvent={addEvent} />);
    await screen.findByText(/No events match/);
    fillForm({ ...created, capacity: '30' });
    fireEvent.click(screen.getByRole('button', { name: 'Create event' }));
    expect(await screen.findByText('Event created successfully.')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'New Seminar' })).toBeVisible();
    expect(addEvent).toHaveBeenCalledWith(expect.objectContaining({ title: 'New Seminar', capacity: 30 }));
  });
  it('does not let an older list response overwrite a successful create', async () => {
    const list = deferred();
    const loadEvents = vi.fn(() => list.promise);
    const created = { ...event, id: '2', title: 'New Seminar' };
    render(<App loadEvents={loadEvents} loadParticipants={() => Promise.resolve([])} addEvent={() => Promise.resolve(created)} />);
    await waitFor(() => expect(loadEvents).toHaveBeenCalled());
    fillForm({ ...created, capacity: '30' });
    fireEvent.click(screen.getByRole('button', { name: 'Create event' }));
    expect(await screen.findByRole('heading', { name: created.title })).toBeVisible();
    list.resolve([event]);
    await waitFor(() => expect(screen.getByRole('heading', { name: created.title })).toBeVisible());
    expect(screen.queryByRole('heading', { name: event.title })).not.toBeInTheDocument();
  });
  it('edits an event in place', async () => {
    const editEvent = vi.fn().mockImplementation((id, values) => Promise.resolve({ id, ...values }));
    render(<App loadEvents={() => Promise.resolve([event])} loadParticipants={() => Promise.resolve([])} editEvent={editEvent} />);
    fireEvent.click(await screen.findByRole('button', { name: `Edit ${event.title}` }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Updated Workshop' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByRole('heading', { name: 'Updated Workshop' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: event.title })).not.toBeInTheDocument();
  });
  it('locks controls during save so another edit cannot replace the active selection', async () => {
    const save = deferred();
    const secondEvent = { ...event, id: '2', title: 'Second Workshop' };
    render(<App loadEvents={() => Promise.resolve([event, secondEvent])} loadParticipants={() => Promise.resolve([])} editEvent={() => save.promise} />);
    fireEvent.click(await screen.findByRole('button', { name: `Edit ${event.title}` }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByLabelText('Title')).toBeDisabled();
    expect(screen.getByRole('button', { name: `Edit ${secondEvent.title}` })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: `Edit ${secondEvent.title}` }));
    save.resolve(event);
    await screen.findByText('Event updated successfully.');
    expect(screen.getByRole('heading', { name: 'Create an event' })).toBeVisible();
  });
  it('deletes an event after explicit confirmation', async () => {
    const removeEvent = vi.fn().mockResolvedValue(null);
    const confirmDelete = vi.fn().mockReturnValue(true);
    render(<App loadEvents={() => Promise.resolve([event])} loadParticipants={() => Promise.resolve([])} removeEvent={removeEvent} confirmDelete={confirmDelete} />);
    fireEvent.click(await screen.findByRole('button', { name: `Delete ${event.title}` }));
    expect(await screen.findByText('Event deleted successfully.')).toBeVisible();
    expect(screen.queryByRole('heading', { name: event.title })).not.toBeInTheDocument();
    expect(confirmDelete).toHaveBeenCalledWith(expect.stringContaining(event.title));
  });
  it('blocks invalid capacity before calling the API', async () => {
    const addEvent = vi.fn();
    render(<App loadEvents={() => Promise.resolve([])} loadParticipants={() => Promise.resolve([])} addEvent={addEvent} />);
    await screen.findByText(/No events match/);
    fillForm({ ...event, capacity: '0' });
    fireEvent.click(screen.getByRole('button', { name: 'Create event' }));
    expect(screen.getByText('Capacity must be a positive integer.')).toBeVisible();
    expect(addEvent).not.toHaveBeenCalled();
  });
  it('shows an API mutation failure without changing the list', async () => {
    render(<App loadEvents={() => Promise.resolve([])} loadParticipants={() => Promise.resolve([])} addEvent={() => Promise.reject(new Error('API unavailable'))} />);
    await screen.findByText(/No events match/);
    fillForm({ ...event, capacity: '30' });
    fireEvent.click(screen.getByRole('button', { name: 'Create event' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('API unavailable');
    expect(screen.queryByRole('heading', { name: event.title })).not.toBeInTheDocument();
  });

  // RELIABILITY-004-1: prove ParticipantSection is mounted within App
  it('mounts the participant section with its heading visible', async () => {
    render(<App loadEvents={() => Promise.resolve([event])} loadParticipants={() => Promise.resolve([])} />);
    expect(await screen.findByText(event.title)).toBeVisible();
    expect(screen.getByRole('heading', { name: /Manage participants/i })).toBeVisible();
    expect(screen.getByText('PARTICIPANTS')).toBeVisible();
  });

  // RELIABILITY-004-2: prove participant section wiring — renders participants loaded via prop
  it('shows participant names and emails inside the App when loaded via prop', async () => {
    const participants = [
      { id: 'p1', name: 'Alice Rivera', email: 'alice@example.com' },
      { id: 'p2', name: 'Bob Chen', email: 'bob@example.com' },
    ];
    render(<App loadEvents={() => Promise.resolve([])} loadParticipants={() => Promise.resolve(participants)} />);
    expect(await screen.findByText(/Alice Rivera/)).toBeVisible();
    expect(screen.getByText(/Bob Chen/)).toBeVisible();
    expect(screen.getByText('alice@example.com')).toBeVisible();
    expect(screen.getByText('bob@example.com')).toBeVisible();
  });

  // RELIABILITY-004-3: prove participant section wiring — loading state visible within App
  it('shows the participant section loading state within the full App render', () => {
    render(<App loadEvents={() => new Promise(() => {})} loadParticipants={() => new Promise(() => {})} />);
    expect(screen.getByText('Loading events...')).toBeVisible();
    // ParticipantSection is also in loading state but StatusPanel text is already captured
    const statusElements = screen.getAllByRole('status');
    expect(statusElements.length).toBeGreaterThanOrEqual(2);
  });
});

function fillForm(values) {
  for (const field of ['Title', 'Description', 'Date', 'Location', 'Category', 'Capacity']) {
    fireEvent.change(screen.getByLabelText(field), { target: { value: String(values[field.toLowerCase()]) } });
  }
}

function deferred() {
  let resolve;
  const promise = new Promise((settle) => { resolve = settle; });
  return { promise, resolve };
}
