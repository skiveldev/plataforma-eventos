import { useEffect, useRef, useState } from 'react';
import StatusPanel from './StatusPanel.jsx';

function getInitials(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function AttendeeSection({ eventId, loadAttendees, revision = 0 }) {
  const [attendees, setAttendees] = useState([]);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const mutationRevision = useRef(0);

  useEffect(() => {
    let active = true;
    const rev = mutationRevision.current;
    if (!eventId) {
      setStatus('empty');
      return;
    }
    setStatus('loading');
    setErrorMessage('');
    loadAttendees(eventId)
      .then((items) => {
        if (active && rev === mutationRevision.current) {
          setAttendees(items);
          setStatus(items.length === 0 ? 'empty' : 'ready');
        }
      })
      .catch((error) => {
        if (active && rev === mutationRevision.current) {
          setErrorMessage(error.message || 'No se pudieron cargar los asistentes.');
          setStatus('error');
        }
      });
    return () => { active = false; };
  }, [eventId, loadAttendees, retryKey, revision]);

  return (
    <section className="attendee-section" aria-labelledby="attendees-heading">
      <div className="toolbar">
        <div>
          <p className="eyebrow">ASISTENTES</p>
          <h2 id="attendees-heading">Asistentes</h2>
        </div>
      </div>

      <StatusPanel state={status} emptyMessage="Aún no hay asistentes registrados." errorMessage={errorMessage}>
        <ul className="participant-list">
          {attendees.map((a) => (
            <li key={a.id}>
              <div className="participant-info">
                <div className="avatar" aria-hidden="true">{getInitials(a.name)}</div>
                <div className="participant-details">
                  <strong>{a.name}</strong>
                  <span>{a.email}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </StatusPanel>

      {status === 'error' && (
        <button
          type="button"
          className="secondary-button"
          onClick={() => setRetryKey((k) => k + 1)}
        >
          Reintentar
        </button>
      )}
    </section>
  );
}
