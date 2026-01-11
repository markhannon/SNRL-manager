/**
 * Event API Routes
 * From 004-simracing-series feature - User Story 2
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  createEvent,
  getEventsByChampionship,
  getEventById,
  updateEvent,
  deleteEvent,
} from '../services/event.service';
import type { EventFilters } from '../models/event';
import { requireAuth } from '../middleware/auth.middleware';
import { ValidationError } from '../utils/errors';

export async function eventRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/championships/:championshipId/events
   * Create a new event for a championship
   */
  fastify.post(
    '/championships/:championshipId/events',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { championshipId } = request.params as { championshipId: string };
      const body = request.body as any;
      const userId = request.user?.id;

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const champId = Number.parseInt(championshipId, 10);
      if (Number.isNaN(champId)) {
        throw new ValidationError('Invalid championship ID');
      }

      // Validate required fields
      if (!body.name || !body.track) {
        throw new ValidationError('Event name and track are required');
      }

      if (!body.eventDate) {
        throw new ValidationError('Event date is required');
      }

      if (!body.raceLengthValue || !body.raceLengthUnit) {
        throw new ValidationError('Race length value and unit are required');
      }

      const event = await createEvent(champId, body, userId);

      return reply.code(201).send(event);
    }
  );

  /**
   * GET /api/championships/:championshipId/events
   * Get all events for a championship
   */
  fastify.get(
    '/championships/:championshipId/events',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { championshipId } = request.params as { championshipId: string };
      const query = request.query as any;

      const champId = Number.parseInt(championshipId, 10);
      if (Number.isNaN(champId)) {
        throw new ValidationError('Invalid championship ID');
      }

      const filters: EventFilters = {
        championshipId: champId,
        status: query.status,
        startDate: query.startDate,
        endDate: query.endDate,
      };

      const events = await getEventsByChampionship(champId, filters);

      return reply.send(events);
    }
  );

  /**
   * GET /api/events/:id
   * Get a single event by ID
   */
  fastify.get(
    '/events/:id',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const eventId = Number.parseInt(id, 10);

      if (Number.isNaN(eventId)) {
        throw new ValidationError('Invalid event ID');
      }

      const event = await getEventById(eventId);

      return reply.send(event);
    }
  );

  /**
   * PUT /api/events/:id
   * Update an event
   */
  fastify.put(
    '/events/:id',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const eventId = Number.parseInt(id, 10);
      const userId = request.user?.id;

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      if (Number.isNaN(eventId)) {
        throw new ValidationError('Invalid event ID');
      }

      const body = request.body as any;
      const event = await updateEvent(eventId, body, userId);

      return reply.send(event);
    }
  );

  /**
   * DELETE /api/events/:id
   * Delete an event
   */
  fastify.delete(
    '/events/:id',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const eventId = Number.parseInt(id, 10);
      const userId = request.user?.id;

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      if (Number.isNaN(eventId)) {
        throw new ValidationError('Invalid event ID');
      }

      await deleteEvent(eventId, userId);

      return reply.code(204).send();
    }
  );
}
