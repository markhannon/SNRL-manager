/**
 * Result API Routes
 * From 004-simracing-series feature - User Story 4
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  enterResults,
  getResultsByEvent,
  updateResult,
  publishResults,
} from '../services/result.service';
import { requireAuth } from '../middleware/auth.middleware';
import { ValidationError } from '../utils/errors';

export async function resultRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/events/:eventId/results
   * Enter results for an event (batch operation)
   */
  fastify.post(
    '/events/:eventId/results',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { eventId } = request.params as { eventId: string };
      const body = request.body as any;
      const userId = request.user?.id;

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const evId = Number.parseInt(eventId, 10);
      if (Number.isNaN(evId)) {
        throw new ValidationError('Invalid event ID');
      }

      if (!body.results || !Array.isArray(body.results)) {
        throw new ValidationError('Results array is required');
      }

      const results = await enterResults(evId, body, userId);

      return reply.code(201).send(results);
    }
  );

  /**
   * GET /api/events/:eventId/results
   * Get results for an event
   */
  fastify.get(
    '/events/:eventId/results',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { eventId } = request.params as { eventId: string };

      const evId = Number.parseInt(eventId, 10);
      if (Number.isNaN(evId)) {
        throw new ValidationError('Invalid event ID');
      }

      const results = await getResultsByEvent(evId);

      return reply.send(results);
    }
  );

  /**
   * PUT /api/events/:eventId/results/:resultId
   * Update a single result
   */
  fastify.put(
    '/events/:eventId/results/:resultId',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { eventId, resultId } = request.params as { eventId: string; resultId: string };
      const body = request.body as any;
      const userId = request.user?.id;

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const evId = Number.parseInt(eventId, 10);
      const resId = Number.parseInt(resultId, 10);

      if (Number.isNaN(evId) || Number.isNaN(resId)) {
        throw new ValidationError('Invalid event or result ID');
      }

      const result = await updateResult(evId, resId, body, userId);

      return reply.send(result);
    }
  );

  /**
   * POST /api/events/:eventId/results/publish
   * Publish results and recalculate standings
   */
  fastify.post(
    '/events/:eventId/results/publish',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { eventId } = request.params as { eventId: string };
      const userId = request.user?.id;

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const evId = Number.parseInt(eventId, 10);
      if (Number.isNaN(evId)) {
        throw new ValidationError('Invalid event ID');
      }

      const results = await publishResults(evId, userId);

      return reply.send(results);
    }
  );
}
