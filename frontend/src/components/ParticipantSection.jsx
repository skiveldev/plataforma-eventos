import { useEffect, useRef, useState } from 'react';
import StatusPanel from './StatusPanel.jsx';

export default function ParticipantSection({ loadParticipants, addParticipant }) {
  const [participants, setParticipants] = useState([]);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [mutationError, setMutationError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const mutationRevision = useRef(0);

  useEffect(() => {
    let active = true;
    const revision = mutationRevision.current;
    setStatus('loading');
    setErrorMessage('');
    loadParticipants()
      .then((items) => {
        if (active && revision === mutationRevision.current) {
          setParticipants(items);
          setStatus(items.length === 0 ? 'empty' : 'ready');
        }
      })
      .catch((error) => {
        if (active && revision === mutationRevision.current) {
          setErrorMessage(error.message || 'Could not load participants.');
          setStatus('error');
        }
      });
    return () => { active = false; };
  }, [loadParticipants, retryKey]);

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function handleSubmit(formEvent) {
    formEvent.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setMutationError('Please enter a name.');
      return;
    }
    if (!trimmedEmail) {
      setMutationError('Please enter an email address.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setMutationError('Please enter a valid email address.');
      return;
    }

    setBusy(true);
    setMutationError(null);
    try {
      const saved = await addParticipant({ name: trimmedName, email: trimmedEmail });
      mutationRevision.current += 1;
      setParticipants((current) => [...current, saved]);
      setStatus('ready');
      setName('');
      setEmail('');
    } catch (error) {
      setMutationError(error.message || 'Could not add participant.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="participant-section" aria-labelledby="participants-heading">
      <div className="toolbar">
        <div>
          <p className="eyebrow">PARTICIPANTS</p>
          <h2 id="participants-heading">Manage participants</h2>
        </div>
      </div>

      <form className="participant-form" onSubmit={handleSubmit} noValidate>
        <label>
          <span>Name</span>
          <input
            type="text"
            value={name}
            disabled={busy}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          <span>Email</span>
          <input
            type="email"
            value={email}
            disabled={busy}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <button className="primary-button" type="submit" disabled={busy}>
          {busy ? 'Adding…' : 'Add participant'}
        </button>
      </form>

      {mutationError && (
        <p className="notice error" role="alert">
          {mutationError}
        </p>
      )}

      <StatusPanel state={status} emptyMessage="No participants yet. Add one above." errorMessage={errorMessage}>
        <ul className="participant-list">
          {participants.map((p) => (
            <li key={p.id}>
              <strong>{p.name}</strong>
              <span>{p.email}</span>
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
