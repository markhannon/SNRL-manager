/**
 * User Management Routes
 * From 001-admin-user feature
 * Admin-only endpoints for user CRUD operations
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as userService from '../services/user.service';
import * as activityLogService from '../services/activityLog.service';
import { requireRole } from '../middleware/auth.middleware';
import type { CreateUserInput, UpdateUserInput } from '../models/user';

interface CreateUserRequest extends FastifyRequest {
  body: CreateUserInput;
}

interface UpdateUserRequest extends FastifyRequest {
  params: {
    id: string;
  };
  body: UpdateUserInput;
}

interface UserIdRequest extends FastifyRequest {
  params: {
    id: string;
  };
}

interface GetUsersRequest extends FastifyRequest {
  querystring: {
    role?: 'admin' | 'editor' | 'member';
    status?: 'active' | 'inactive' | 'deleted';
    search?: string;
  };
}

export async function userRoutes(fastify: FastifyInstance) {
  /**
   * GET /users
   * Get all users (admin only)
   */
  fastify.get('/users', {
    preHandler: requireRole('admin'),
  }, async (request: GetUsersRequest, reply: FastifyReply) => {
    const users = await userService.getUsers(request.query);
    return { users };
  });

  /**
   * GET /users/:id
   * Get user by ID (admin only)
   */
  fastify.get('/users/:id', {
    preHandler: requireRole('admin'),
  }, async (request: UserIdRequest, reply: FastifyReply) => {
    const user = await userService.getUserById(parseInt(request.params.id));
    return { user };
  });

  /**
   * POST /users
   * Create new user (admin only)
   */
  fastify.post('/users', {
    preHandler: requireRole('admin'),
  }, async (request: CreateUserRequest, reply: FastifyReply) => {
    const user = await userService.createUser(request.body);

    // Log activity
    await activityLogService.logActivity({
      admin_id: request.user!.id,
      action: activityLogService.ActivityAction.UserCreated,
      target_entity_type: 'user',
      target_entity_id: user.id,
      changes: {
        email: user.email,
        role: user.role,
      },
    });

    reply.code(201);
    return { user };
  });

  /**
   * PUT /users/:id
   * Update user (admin only)
   */
  fastify.put('/users/:id', {
    preHandler: requireRole('admin'),
  }, async (request: UpdateUserRequest, reply: FastifyReply) => {
    const userId = parseInt(request.params.id);
    const oldUser = await userService.getUserById(userId);
    const user = await userService.updateUser(userId, request.body);

    // Log activity
    const action = oldUser.role !== user.role
      ? activityLogService.ActivityAction.RoleChanged
      : activityLogService.ActivityAction.UserUpdated;

    await activityLogService.logActivity({
      admin_id: request.user!.id,
      action,
      target_entity_type: 'user',
      target_entity_id: user.id,
      changes: request.body,
    });

    return { user };
  });

  /**
   * DELETE /users/:id
   * Delete user (admin only)
   */
  fastify.delete('/users/:id', {
    preHandler: requireRole('admin'),
  }, async (request: UserIdRequest, reply: FastifyReply) => {
    const userId = parseInt(request.params.id);
    await userService.deleteUser(userId);

    // Log activity
    await activityLogService.logActivity({
      admin_id: request.user!.id,
      action: activityLogService.ActivityAction.UserDeleted,
      target_entity_type: 'user',
      target_entity_id: userId,
    });

    reply.code(204);
    return;
  });
}
