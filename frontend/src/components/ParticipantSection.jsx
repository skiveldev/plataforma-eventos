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
          setErrorMessage(error.message || 'No se pudieron cargar los participantes.');
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
      setMutationError('Ingrese un nombre.');
      return;
    }
    if (!trimmedEmail) {
      setMutationError('Ingrese un correo electrónico.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setMutationError('Ingrese un correo electrónico válido.');
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
      setMutationError(error.message || 'No se pudo agregar el participante.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="participant-section" aria-labelledby="participants-heading">
      <div className="toolbar">
        <div>
          <p className="eyebrow">PARTICIPANTES</p>
          <h2 id="participants-heading">Gestionar participantes</h2>
        </div>
      </div>

      <form className="participant-form" onSubmit={handleSubmit} noValidate>
        <label>
          <span>Nombre</span>
          <input
            type="text"
            value={name}
            disabled={busy}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          <span>Correo electrónico</span>
          <input
            type="email"
            value={email}
            disabled={busy}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <button className="primary-button" type="submit" disabled={busy}>
          {busy ? 'Agregando…' : 'Agregar participante'}
        </button>
      </form>

      {mutationError && (
        <p className="notice error" role="alert">
          {mutationError}
        </p>
      )}

      <StatusPanel state={status} emptyMessage="Aún no hay participantes. Agregue uno arriba." errorMessage={errorMessage}>
        <ul className="participant-list">
          {participants.map((p) => (
            <li key={p.id}>
              <div className="participant-info">
                <div className="avatar" aria-hidden="true">{getInitials(p.name)}</div>
                <div className="participant-details">
                  <strong>{p.name}</strong>
                  <span>{p.email}</span>
                </div>
              </div>
              <button type="button" className="participant-delete" aria-label={`Eliminar ${p.name}`}>&#x2715;</button>
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
