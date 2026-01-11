/**
 * Points Scheme API Routes
 * From 004-simracing-series feature
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  createPointsScheme,
  getPointsSchemeById,
  getPointsSchemes,
  updatePointsScheme,
  deletePointsScheme,
} from '../services/pointsScheme.service';
import { PREDEFINED_SCHEMES } from '../models/pointsScheme';
import { requireAuth } from '../middleware/auth.middleware';
import { ValidationError } from '../utils/errors';

export async function pointsSchemeRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/points-schemes/predefined
   * Get predefined points schemes
   */
  fastify.get(
    '/points-schemes/predefined',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.send(PREDEFINED_SCHEMES);
    }
  );

  /**
   * POST /api/points-schemes
   * Create a new points scheme
   */
  fastify.post(
    '/points-schemes',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as any;
      const userId = request.user?.id;

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      // Validate required fields
      if (!body.name) {
        throw new ValidationError('Name is required');
      }

      if (!body.pointsMapping) {
        throw new ValidationError('Points mapping is required');
      }

      const pointsScheme = await createPointsScheme(body, userId);

      return reply.code(201).send(pointsScheme);
    }
  );

  /**
   * GET /api/points-schemes
   * List all points schemes
   */
  fastify.get(
    '/points-schemes',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const schemes = await getPointsSchemes();

      return reply.send(schemes);
    }
  );

  /**
   * GET /api/points-schemes/:id
   * Get a single points scheme by ID
   */
  fastify.get(
    '/points-schemes/:id',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const schemeId = Number.parseInt(id, 10);

      if (Number.isNaN(schemeId)) {
        throw new ValidationError('Invalid points scheme ID');
      }

      const scheme = await getPointsSchemeById(schemeId);

      return reply.send(scheme);
    }
  );

  /**
   * PUT /api/points-schemes/:id
   * Update a points scheme
   */
  fastify.put(
    '/points-schemes/:id',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const schemeId = Number.parseInt(id, 10);
      const userId = request.user?.id;

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      if (Number.isNaN(schemeId)) {
        throw new ValidationError('Invalid points scheme ID');
      }

      const body = request.body as any;
      const scheme = await updatePointsScheme(schemeId, body, userId);

      return reply.send(scheme);
    }
  );

  /**
   * DELETE /api/points-schemes/:id
   * Delete a points scheme
   */
  fastify.delete(
    '/points-schemes/:id',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const schemeId = Number.parseInt(id, 10);
      const userId = request.user?.id;

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      if (Number.isNaN(schemeId)) {
        throw new ValidationError('Invalid points scheme ID');
      }

      await deletePointsScheme(schemeId, userId);

      return reply.code(204).send();
    }
  );
}
