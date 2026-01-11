import Fastify from 'fastify';
import cors from '@fastify/cors';
import logger from './utils/logger';
import { seriesRoutes } from './api/series.routes';
import { AppError } from './utils/errors';

/**
 * SNRL Manager Backend Server
 * Node.js 20 LTS + TypeScript 5.x + Fastify 4.x
 */

const fastify = Fastify({
  logger,
});

// Register CORS
fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
});

// Health check endpoint
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register API routes
fastify.register(async (instance) => {
  instance.register(seriesRoutes, { prefix: '/api' });
  // Add more route modules here as they're implemented
}, { prefix: '' });

// Global error handler
fastify.setErrorHandler((error, request, reply) => {
  if (error instanceof AppError) {
    reply.code(error.statusCode).send({
      error: error.message,
      statusCode: error.statusCode,
    });
  } else {
    logger.error({ err: error }, 'Unhandled error');
    reply.code(500).send({
      error: 'Internal Server Error',
      statusCode: 500,
    });
  }
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    logger.info(`Server listening on ${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

export default fastify;
