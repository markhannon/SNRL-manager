/**
 * Authentication Routes
 * From 001-admin-user feature
 * Handles login, logout, and token refresh
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as userService from '../services/user.service';
import { requireAuth } from '../middleware/auth.middleware';
import type { LoginCredentials } from '../models/user';

interface LoginRequest extends FastifyRequest {
  body: LoginCredentials;
}

interface ChangePasswordRequest extends FastifyRequest {
  body: {
    oldPassword: string;
    newPassword: string;
  };
}

export async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /auth/login
   * Authenticate user and return JWT token
   */
  fastify.post('/auth/login', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '15 minutes',
      },
    },
  }, async (request: LoginRequest, reply: FastifyReply) => {
    const result = await userService.authenticateUser(
      request.body,
      (payload) => fastify.jwt.sign(payload)
    );

    // Set httpOnly cookie
    reply.setCookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return {
      user: result.user,
      token: result.token,
    };
  });

  /**
   * POST /auth/logout
   * Clear authentication token
   */
  fastify.post('/auth/logout', {
    preHandler: requireAuth,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    reply.clearCookie('token', {
      path: '/',
    });

    return { success: true };
  });

  /**
   * GET /auth/me
   * Get current authenticated user
   */
  fastify.get('/auth/me', {
    preHandler: requireAuth,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await userService.getUserById(request.user!.id);
    return { user };
  });

  /**
   * POST /auth/change-password
   * Change current user's password
   */
  fastify.post('/auth/change-password', {
    preHandler: requireAuth,
    config: {
      rateLimit: {
        max: 3,
        timeWindow: '15 minutes',
      },
    },
  }, async (request: ChangePasswordRequest, reply: FastifyReply) => {
    await userService.changePassword(
      request.user!.id,
      request.body.oldPassword,
      request.body.newPassword
    );

    return { success: true };
  });
}
