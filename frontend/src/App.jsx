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
      setNotice({ type: 'success', text: submittedEvent ? 'Evento actualizado exitosamente.' : 'Evento creado exitosamente.' });
      setEditing((current) => current?.id === submittedEvent?.id ? null : current);
    } catch (error) { setNotice({ type: 'error', text: error.message || 'No se pudo guardar el evento. Intente nuevamente.' }); }
    finally { setSubmitting(false); }
  }

  async function handleDelete(event) {
    if (!confirmDelete(`\u00bfEliminar \u201c${event.title}\u201d? Esta acci\u00f3n no se puede deshacer.`)) return;
    setNotice(null);
    try { await removeEvent(event.id); mutationRevision.current += 1; setEvents((current) => current.filter((item) => item.id !== event.id)); setStatus('ready'); setNotice({ type: 'success', text: 'Evento eliminado exitosamente.' }); }
    catch (error) { setNotice({ type: 'error', text: error.message || 'No se pudo eliminar el evento. Intente nuevamente.' }); }
  }

  return <>
    {/* Sticky navigation header */}
    <header className="sticky-header">
      <div className="header-inner">
        <a href="#" className="brand">AgendaU</a>
        <nav className="header-nav" aria-label="Navegación principal">
          <a href="#">Explore</a>
          <a href="#" className="active">Eventos</a>
          <a href="#">Participantes</a>
        </nav>
        <div className="header-actions">
          <button type="button" className="header-cta" aria-label="Ir al formulario de creación" onClick={() => document.getElementById('event-form-section').scrollIntoView({ behavior: 'smooth' })}>Crear evento</button>
        </div>
      </div>
    </header>

    {/* Hero section */}
    <section className="hero">
      <div className="hero-inner">
        <p className="eyebrow">PLATAFORMA DE EVENTOS ACADÉMICOS</p>
        <h1>Aprende, conecta y participa.</h1>
        <p className="hero-subtitle">Encuentra talleres, seminarios y experiencias del campus en una agenda clara y organizada para la comunidad.</p>
      </div>
    </section>

    {/* Main content */}
    <main>
      <div id="event-form-section">
        <EventForm key={editing?.id || 'create'} event={editing} busy={submitting} onCancel={() => setEditing(null)} onSubmit={saveEvent} />
      </div>
      {notice && <p className={`notice ${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>{notice.text}</p>}
      <section className="events-section" aria-labelledby="events-heading">
        <div className="toolbar"><div><p className="eyebrow">PRÓXIMOS</p><h2 id="events-heading">Explorar eventos</h2></div><label><span className="sr-only">Buscar eventos</span><input type="search" placeholder="Buscar por tema o lugar" value={search} disabled={submitting} onChange={(event) => setSearch(event.target.value)} /></label></div>
        {status === 'loading' && <p className="state" role="status">Cargando eventos...</p>}
        {status === 'error' && <p className="state error" role="alert">No se pudo cargar la agenda. Verifique la API e intente nuevamente.</p>}
        {status === 'ready' && events.length === 0 && <p className="state">No hay eventos que coincidan con su búsqueda.</p>}
        {status === 'ready' && events.length > 0 && <div className="event-grid">{events.map((event) => <article key={event.id} className="event-card"><div className="event-meta"><span>{event.category}</span><time className="event-date" dateTime={event.date}>{new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(event.date))}</time></div><h3>{event.title}</h3><p>{event.description}</p><footer><span>{event.location}</span><span className="event-capacity">{event.capacity} lugares</span></footer><div className="card-actions"><button type="button" disabled={submitting} onClick={() => { setEditing(event); setNotice(null); }}>Editar {event.title}</button><button type="button" className="danger-button" disabled={submitting} onClick={() => handleDelete(event)}>Eliminar {event.title}</button></div></article>)}</div>}
      </section>
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

    {/* Footer */}
    <footer className="site-footer">
      <div className="footer-inner">
        <strong>AgendaU</strong>
        <span>© 2024 AgendaU Academic Platforms.</span>
      </div>
    </footer>
  </>;
}
