import { useState } from 'react';

export default function EnrollmentSection({ events, participants, registerParticipant, onEventSelect, onEnrollmentSuccess }) {
  const [eventId, setEventId] = useState('');
  const [participantId, setParticipantId] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null); // null | 'success' | 'error'
  const [message, setMessage] = useState('');

  function handleEventChange(e) {
    const id = e.target.value;
    setEventId(id);
    if (onEventSelect) onEventSelect(id);
  }

  async function handleSubmit(formEvent) {
    formEvent.preventDefault();
    if (!eventId || !participantId) return;
    setBusy(true);
    setStatus(null);
    setMessage('');
    try {
      await registerParticipant(eventId, participantId);
      setStatus('success');
      setMessage('¡Inscripción exitosa!');
      if (onEnrollmentSuccess) onEnrollmentSuccess(eventId);
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'No se pudo inscribir. Intente nuevamente.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="enrollment-section" aria-labelledby="enrollment-heading">
      <div className="toolbar">
        <div>
          <p className="eyebrow">INSCRIPCIÓN</p>
          <h2 id="enrollment-heading">Inscribir un participante</h2>
        </div>
      </div>

      <form className="enrollment-form" onSubmit={handleSubmit}>
        <label>
          <span>Evento</span>
          <select
            value={eventId}
            disabled={busy}
            onChange={handleEventChange}
            aria-label="Evento"
          >
            <option value="">Seleccionar un evento…</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Participante</span>
          <select
            value={participantId}
            disabled={busy}
            onChange={(e) => setParticipantId(e.target.value)}
            aria-label="Participante"
          >
            <option value="">Seleccionar un participante…</option>
            {participants.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>

        <button className="primary-button" type="submit" disabled={busy || !eventId || !participantId}>
          {busy ? 'Inscribiendo…' : 'Inscribir'}
        </button>
      </form>

      {status === 'success' && <p className="notice" role="status">{message}</p>}
      {status === 'error' && <p className="notice error" role="alert">{message}</p>}
    </section>
  );
}
