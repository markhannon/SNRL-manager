import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as seriesService from '../services/series.service';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { CreateSeriesDTO, UpdateSeriesDTO, SeriesFilters } from '../models/contentSeries';

/**
 * Series Routes
 * T022: GET/POST/PUT/DELETE /api/series, GET /api/series/:id
 * T023: Apply authentication and authorization middleware
 */

export async function seriesRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/series
   * List all series with pagination and filters
   * Public access (all authenticated users can view series list)
   */
  fastify.get('/series', {
    preHandler: [requireAuth],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['active', 'deleted'] },
          created_by: { type: 'number' },
          search: { type: 'string' },
          page: { type: 'number', minimum: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100 },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const filters = request.query as SeriesFilters;
    const result = await seriesService.listSeries(filters);
    return reply.send(result);
  });

  /**
   * POST /api/series
   * Create new series
   * Requires: Editor or Admin role
   */
  fastify.post('/series', {
    preHandler: [requireRole('admin', 'editor')],
    schema: {
      body: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          description: { type: 'string', maxLength: 5000 },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { title: string; description?: string };

    if (!request.user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const dto: CreateSeriesDTO = {
      title: body.title,
      description: body.description,
      created_by: request.user.id,
    };

    const series = await seriesService.createSeries(dto);
    return reply.code(201).send(series);
  });

  /**
   * GET /api/series/:id
   * Get series by ID with content count
   * Public access (all authenticated users)
   */
  fastify.get('/series/:id', {
    preHandler: [requireAuth],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' },
        },
        required: ['id'],
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: number };
    const series = await seriesService.getSeries(id);
    return reply.send(series);
  });

  /**
   * PUT /api/series/:id
   * Update series
   * Requires: Editor or Admin role
   */
  fastify.put('/series/:id', {
    preHandler: [requireRole('admin', 'editor')],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          description: { type: ['string', 'null'], maxLength: 5000 },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: number };
    const body = request.body as UpdateSeriesDTO;

    if (!request.user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const series = await seriesService.updateSeries(id, body, request.user.id);
    return reply.send(series);
  });

  /**
   * DELETE /api/series/:id
   * Soft-delete series
   * Requires: Editor or Admin role
   */
  fastify.delete('/series/:id', {
    preHandler: [requireRole('admin', 'editor')],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' },
        },
        required: ['id'],
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: number };

    if (!request.user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    await seriesService.deleteSeries(id, request.user.id);
    return reply.code(204).send();
  });
}
