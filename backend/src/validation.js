export class ValidationError extends Error {}

export function requireFields(body, fields) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('Request body must be a JSON object');
  }
  const missing = fields.filter((field) => body[field] === undefined || body[field] === '');
  if (missing.length) throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
}

export function validateEvent(body) {
  requireFields(body, ['title', 'description', 'date', 'location', 'category', 'capacity']);
  if (Number.isNaN(Date.parse(body.date))) throw new ValidationError('date must be a valid date');
  if (!Number.isInteger(body.capacity) || body.capacity < 1) throw new ValidationError('capacity must be a positive integer');
}

export function validateParticipant(body) {
  requireFields(body, ['name', 'email']);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) throw new ValidationError('email must be valid');
}
