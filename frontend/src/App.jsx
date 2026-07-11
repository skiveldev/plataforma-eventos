import { useEffect, useRef, useState } from 'react';
import { createEvent, deleteEvent, getEvents, updateEvent } from './api/eventsApi.js';
import { createParticipant, getParticipants } from './api/participantsApi.js';
import { getAttendees, register } from './api/registrationsApi.js';
import EventForm from './EventForm.jsx';
import ParticipantSection from './components/ParticipantSection.jsx';
import EnrollmentSection from './components/EnrollmentSection.jsx';
import AttendeeSection from './components/AttendeeSection.jsx';

export default function App({ loadEvents = getEvents, addEvent = createEvent, editEvent = updateEvent, removeEvent = deleteEvent, confirmDelete = window.confirm, loadParticipants = getParticipants, addParticipant = createParticipant, enrollParticipant = register, loadAttendees = getAttendees }) {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('loading');
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participantStatus, setParticipantStatus] = useState('loading');
  const [enrollmentEventId, setEnrollmentEventId] = useState('');
  const [attendeeRevision, setAttendeeRevision] = useState(0);
  const mutationRevision = useRef(0);
  const participantRevision = useRef(0);

  useEffect(() => {
    let active = true;
    const revision = mutationRevision.current;
    setStatus('loading');
    const timer = setTimeout(() => loadEvents(search).then((items) => { if (active && revision === mutationRevision.current) { setEvents(items); setStatus('ready'); } }).catch(() => { if (active && revision === mutationRevision.current) setStatus('error'); }), 250);
    return () => { active = false; clearTimeout(timer); };
  }, [search, loadEvents]);

  useEffect(() => {
    let active = true;
    const revision = participantRevision.current;
    setParticipantStatus('loading');
    loadParticipants()
      .then((items) => { if (active && revision === participantRevision.current) { setParticipants(items); setParticipantStatus('ready'); } })
      .catch(() => { if (active && revision === participantRevision.current) setParticipantStatus('error'); });
    return () => { active = false; };
  }, [loadParticipants]);

  async function saveEvent(values) {
    const submittedEvent = editing;
    setSubmitting(true); setNotice(null);
    try {
      const saved = submittedEvent ? await editEvent(submittedEvent.id, values) : await addEvent(values);
      mutationRevision.current += 1;
      setEvents((current) => submittedEvent ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
      setStatus('ready');
      setNotice({ type: 'success', text: submittedEvent ? 'Event updated successfully.' : 'Event created successfully.' });
      setEditing((current) => current?.id === submittedEvent?.id ? null : current);
    } catch (error) { setNotice({ type: 'error', text: error.message || 'Could not save the event. Please try again.' }); }
    finally { setSubmitting(false); }
  }

  async function handleDelete(event) {
    if (!confirmDelete(`Delete “${event.title}”? This action cannot be undone.`)) return;
    setNotice(null);
    try { await removeEvent(event.id); mutationRevision.current += 1; setEvents((current) => current.filter((item) => item.id !== event.id)); setStatus('ready'); setNotice({ type: 'success', text: 'Event deleted successfully.' }); }
    catch (error) { setNotice({ type: 'error', text: error.message || 'Could not delete the event. Please try again.' }); }
  }

  return <>
    <header className="hero">
      <nav><strong>AgendaU</strong><span>Academic community events</span></nav>
      <div className="hero-content"><p className="eyebrow">PLATAFORMA DE EVENTOS ACADÉMICOS</p><h1>Learn, connect, and take part.</h1><p>Find workshops, seminars, and campus experiences in one clear agenda.</p></div>
    </header>
    <main>
      <EventForm key={editing?.id || 'create'} event={editing} busy={submitting} onCancel={() => setEditing(null)} onSubmit={saveEvent} />
      {notice && <p className={`notice ${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>{notice.text}</p>}
       <section className="toolbar" aria-labelledby="events-heading"><div><p className="eyebrow">UPCOMING</p><h2 id="events-heading">Explore events</h2></div><label><span className="sr-only">Search events</span><input type="search" placeholder="Search by topic or place" value={search} disabled={submitting} onChange={(event) => setSearch(event.target.value)} /></label></section>
      {status === 'loading' && <p className="state" role="status">Loading events...</p>}
      {status === 'error' && <p className="state error" role="alert">We could not load the agenda. Check the API and try again.</p>}
      {status === 'ready' && events.length === 0 && <p className="state">No events match your search.</p>}
       {status === 'ready' && events.length > 0 && <div className="event-grid">{events.map((event) => <article key={event.id} className="event-card"><div className="event-meta"><span>{event.category}</span><time dateTime={event.date}>{new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(event.date))}</time></div><h3>{event.title}</h3><p>{event.description}</p><footer><span>{event.location}</span><span>{event.capacity} places</span></footer><div className="card-actions"><button type="button" disabled={submitting} onClick={() => { setEditing(event); setNotice(null); }}>Edit {event.title}</button><button type="button" className="danger-button" disabled={submitting} onClick={() => handleDelete(event)}>Delete {event.title}</button></div></article>)}</div>}
      <ParticipantSection loadParticipants={loadParticipants} addParticipant={addParticipant} />
      <EnrollmentSection
        events={events}
        participants={participants}
        registerParticipant={enrollParticipant}
        onEventSelect={setEnrollmentEventId}
        onEnrollmentSuccess={() => setAttendeeRevision((r) => r + 1)}
      />
      <AttendeeSection
        eventId={enrollmentEventId}
        loadAttendees={loadAttendees}
        revision={attendeeRevision}
      />
    </main>
    <footer className="site-footer"><strong>AgendaU</strong><span>Built for academic life.</span></footer>
  </>;
}
