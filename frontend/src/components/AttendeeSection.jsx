import { useEffect, useRef, useState } from 'react';
import StatusPanel from './StatusPanel.jsx';

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
          setErrorMessage(error.message || 'Could not load attendees.');
          setStatus('error');
        }
      });
    return () => { active = false; };
  }, [eventId, loadAttendees, retryKey, revision]);

  return (
    <section className="attendee-section" aria-labelledby="attendees-heading">
      <div className="toolbar">
        <div>
          <p className="eyebrow">ATTENDEES</p>
          <h2 id="attendees-heading">Attendees</h2>
        </div>
      </div>

      <StatusPanel state={status} emptyMessage="No attendees registered yet." errorMessage={errorMessage}>
        <ul className="participant-list">
          {attendees.map((a) => (
            <li key={a.id}>
              <strong>{a.name}</strong>
              <span>{a.email}</span>
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
          Retry
        </button>
      )}
    </section>
  );
}
