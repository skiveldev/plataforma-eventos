import { useState } from 'react';

const emptyEvent = { title: '', description: '', date: '', location: '', category: '', capacity: '' };

export default function EventForm({ event, busy, onCancel, onSubmit }) {
  const [values, setValues] = useState(event ? { ...event, capacity: String(event.capacity) } : emptyEvent);
  const [errors, setErrors] = useState({});
  const editing = Boolean(event);

  function submit(formEvent) {
    formEvent.preventDefault();
    const nextErrors = {};
    for (const field of Object.keys(emptyEvent)) if (!String(values[field]).trim()) nextErrors[field] = 'This field is required.';
    if (values.date && Number.isNaN(Date.parse(values.date))) nextErrors.date = 'Enter a valid date.';
    if (values.capacity && (!Number.isInteger(Number(values.capacity)) || Number(values.capacity) < 1)) nextErrors.capacity = 'Capacity must be a positive integer.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSubmit({ ...values, capacity: Number(values.capacity) });
  }

  return <form className="event-form" onSubmit={submit} noValidate aria-labelledby="form-heading">
    <div className="form-heading"><div><p className="eyebrow">ADMINISTRATION</p><h2 id="form-heading">{editing ? 'Edit event' : 'Create an event'}</h2></div>{editing && <button type="button" className="text-button" disabled={busy} onClick={onCancel}>Cancel</button>}</div>
    <div className="form-grid">{Object.keys(emptyEvent).map((field) => <label key={field} className={field === 'description' ? 'wide' : ''}><span>{field[0].toUpperCase() + field.slice(1)}</span>{field === 'description' ? <textarea value={values[field]} disabled={busy} onChange={(e) => setValues({ ...values, [field]: e.target.value })} aria-invalid={Boolean(errors[field])} aria-describedby={errors[field] ? `${field}-error` : undefined} /> : <input type={field === 'date' ? 'date' : field === 'capacity' ? 'number' : 'text'} min={field === 'capacity' ? '1' : undefined} step={field === 'capacity' ? '1' : undefined} value={values[field]} disabled={busy} onChange={(e) => setValues({ ...values, [field]: e.target.value })} aria-invalid={Boolean(errors[field])} aria-describedby={errors[field] ? `${field}-error` : undefined} />}{errors[field] && <small id={`${field}-error`} className="field-error">{errors[field]}</small>}</label>)}</div>
    <button className="primary-button" disabled={busy}>{busy ? 'Saving...' : editing ? 'Save changes' : 'Create event'}</button>
  </form>;
}
