/**
 * Championship API Routes
 * From 004-simracing-series feature
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  createChampionship,
  getChampionshipById,
  getChampionships,
  updateChampionship,
  deleteChampionship,
} from '../services/championship.service';
import type { ChampionshipFilters } from '../models/championship';
import { requireAuth } from '../middleware/auth.middleware';
import { ValidationError } from '../utils/errors';

export async function championshipRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/championships
   * Create a new championship
   */
  fastify.post(
    '/championships',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as any;
      const userId = request.user?.id;

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      // Validate required fields
      if (!body.name || !body.simulator) {
        throw new ValidationError('Name and simulator are required');
      }

      if (!body.seasonStart || !body.seasonEnd) {
        throw new ValidationError('Season start and end dates are required');
      }

      if (!body.pointsSchemeId) {
        throw new ValidationError('Points scheme is required');
      }

      const championship = await createChampionship(body, userId);

      return reply.code(201).send(championship);
    }
  );

  /**
   * GET /api/championships
   * List all championships with optional filters
   */
  fastify.get(
    '/championships',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as any;

      const filters: ChampionshipFilters = {
        status: query.status,
        simulator: query.simulator,
        createdBy: query.createdBy ? Number.parseInt(query.createdBy, 10) : undefined,
      };

      const championships = await getChampionships(filters);

      return reply.send(championships);
    }
  );

  /**
   * GET /api/championships/:id
   * Get a single championship by ID
   */
  fastify.get(
    '/championships/:id',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const championshipId = Number.parseInt(id, 10);

      if (Number.isNaN(championshipId)) {
        throw new ValidationError('Invalid championship ID');
      }

      const championship = await getChampionshipById(championshipId);

      return reply.send(championship);
    }
  );

  /**
   * PUT /api/championships/:id
   * Update a championship
   */
  fastify.put(
    '/championships/:id',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const championshipId = Number.parseInt(id, 10);
      const userId = request.user?.id;

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      if (Number.isNaN(championshipId)) {
        throw new ValidationError('Invalid championship ID');
      }

      const body = request.body as any;
      const championship = await updateChampionship(championshipId, body, userId);

      return reply.send(championship);
    }
  );

  /**
   * DELETE /api/championships/:id
   * Delete a championship
   */
  fastify.delete(
    '/championships/:id',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const championshipId = Number.parseInt(id, 10);
      const userId = request.user?.id;

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      if (Number.isNaN(championshipId)) {
        throw new ValidationError('Invalid championship ID');
      }

      await deleteChampionship(championshipId, userId);

      return reply.code(204).send();
    }
  );
}
