import { useState } from 'react';

const emptyEvent = { title: '', description: '', date: '', location: '', category: '', capacity: '' };
const fieldLabels = { title: 'Título', description: 'Descripción', date: 'Fecha', location: 'Ubicación', category: 'Categoría', capacity: 'Capacidad' };

export default function EventForm({ event, busy, onCancel, onSubmit }) {
  const [values, setValues] = useState(event ? { ...event, capacity: String(event.capacity) } : emptyEvent);
  const [errors, setErrors] = useState({});
  const editing = Boolean(event);

  function submit(formEvent) {
    formEvent.preventDefault();
    const nextErrors = {};
    for (const field of Object.keys(emptyEvent)) if (!String(values[field]).trim()) nextErrors[field] = 'Este campo es obligatorio.';
    if (values.date && Number.isNaN(Date.parse(values.date))) nextErrors.date = 'Ingrese una fecha válida.';
    if (values.capacity && (!Number.isInteger(Number(values.capacity)) || Number(values.capacity) < 1)) nextErrors.capacity = 'La capacidad debe ser un número entero positivo.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSubmit({ ...values, capacity: Number(values.capacity) });
  }

  return <form className="event-form" onSubmit={submit} noValidate aria-labelledby="form-heading">
    <div className="form-heading"><div><p className="eyebrow">ADMINISTRACIÓN</p><h2 id="form-heading">{editing ? 'Editar evento' : 'Crear un evento'}</h2></div>{editing && <button type="button" className="text-button" disabled={busy} onClick={onCancel}>Cancelar</button>}</div>
    <div className="form-grid">{Object.keys(emptyEvent).map((field) => <label key={field} className={field === 'description' ? 'wide' : ''}><span>{fieldLabels[field]}</span>{field === 'description' ? <textarea value={values[field]} disabled={busy} onChange={(e) => setValues({ ...values, [field]: e.target.value })} aria-invalid={Boolean(errors[field])} aria-describedby={errors[field] ? `${field}-error` : undefined} /> : <input type={field === 'date' ? 'date' : field === 'capacity' ? 'number' : 'text'} min={field === 'capacity' ? '1' : undefined} step={field === 'capacity' ? '1' : undefined} value={values[field]} disabled={busy} onChange={(e) => setValues({ ...values, [field]: e.target.value })} aria-invalid={Boolean(errors[field])} aria-describedby={errors[field] ? `${field}-error` : undefined} />}{errors[field] && <small id={`${field}-error`} className="field-error">{errors[field]}</small>}</label>)}</div>
    <button className="primary-button" disabled={busy}>{busy ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear evento'}</button>
  </form>;
}
