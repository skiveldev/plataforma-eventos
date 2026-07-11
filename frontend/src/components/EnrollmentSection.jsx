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
      setMessage('Registration successful!');
      if (onEnrollmentSuccess) onEnrollmentSuccess(eventId);
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Could not enroll. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="enrollment-section" aria-labelledby="enrollment-heading">
      <div className="toolbar">
        <div>
          <p className="eyebrow">ENROLLMENT</p>
          <h2 id="enrollment-heading">Enroll a participant</h2>
        </div>
      </div>

      <form className="enrollment-form" onSubmit={handleSubmit}>
        <label>
          <span>Event</span>
          <select
            value={eventId}
            disabled={busy}
            onChange={handleEventChange}
            aria-label="Event"
          >
            <option value="">Select an event…</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Participant</span>
          <select
            value={participantId}
            disabled={busy}
            onChange={(e) => setParticipantId(e.target.value)}
            aria-label="Participant"
          >
            <option value="">Select a participant…</option>
            {participants.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>

        <button className="primary-button" type="submit" disabled={busy || !eventId || !participantId}>
          {busy ? 'Enrolling…' : 'Enroll'}
        </button>
      </form>

      {status === 'success' && <p className="notice" role="status">{message}</p>}
      {status === 'error' && <p className="notice error" role="alert">{message}</p>}
    </section>
  );
}
