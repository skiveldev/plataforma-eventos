import { randomUUID } from 'node:crypto';
import { ValidationError, validateEvent, validateParticipant } from '../validation.js';

export class NotFoundError extends Error {}
export class ConflictError extends Error {}

export function createAgendaService(repository) {
  return {
    async listEvents(search = '') {
      const { events } = await repository.read();
      const term = search.trim().toLowerCase();
      return term ? events.filter((event) => [event.title, event.description, event.category, event.location].some((value) => value.toLowerCase().includes(term))) : events;
    },
    async getEvent(id) {
      const event = (await repository.read()).events.find((item) => item.id === id);
      if (!event) throw new NotFoundError('Event not found');
      return event;
    },
    async createEvent(input) {
      validateEvent(input);
      const event = { id: randomUUID(), ...input };
      return repository.update((data) => (data.events.push(event), event));
    },
    async updateEvent(id, input) {
      validateEvent(input);
      return repository.update((data) => {
        const index = data.events.findIndex((event) => event.id === id);
        if (index < 0) throw new NotFoundError('Event not found');
        const registrationCount = data.registrations.filter((registration) => registration.eventId === id).length;
        if (input.capacity < registrationCount) throw new ConflictError('Capacity cannot be lower than current registration count');
        return (data.events[index] = { id, ...input });
      });
    },
    async deleteEvent(id) {
      return repository.update((data) => {
        const index = data.events.findIndex((event) => event.id === id);
        if (index < 0) throw new NotFoundError('Event not found');
        data.events.splice(index, 1);
        data.registrations = data.registrations.filter((registration) => registration.eventId !== id);
      });
    },
    async listParticipants() { return (await repository.read()).participants; },
    async createParticipant(input) {
      validateParticipant(input);
      return repository.update((data) => {
        if (data.participants.some((participant) => participant.email.toLowerCase() === input.email.toLowerCase())) throw new ConflictError('Email is already registered');
        const participant = { id: randomUUID(), ...input };
        data.participants.push(participant);
        return participant;
      });
    },
    async register(eventId, participantId) {
      return repository.update((data) => {
        const event = data.events.find((item) => item.id === eventId);
        if (!event) throw new NotFoundError('Event not found');
        if (!data.participants.some((item) => item.id === participantId)) throw new NotFoundError('Participant not found');
        if (data.registrations.some((item) => item.eventId === eventId && item.participantId === participantId)) throw new ConflictError('Participant is already registered');
        const attendees = data.registrations.filter((item) => item.eventId === eventId);
        if (attendees.length >= event.capacity) throw new ConflictError('Event capacity reached');
        const registration = { id: randomUUID(), eventId, participantId, createdAt: new Date().toISOString() };
        data.registrations.push(registration);
        return registration;
      });
    },
    async listAttendees(eventId) {
      const data = await repository.read();
      if (!data.events.some((event) => event.id === eventId)) throw new NotFoundError('Event not found');
      const ids = new Set(data.registrations.filter((item) => item.eventId === eventId).map((item) => item.participantId));
      return data.participants.filter((participant) => ids.has(participant.id));
    }
  };
}
