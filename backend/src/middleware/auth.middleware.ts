import { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError } from '../utils/errors';

/**
 * Authentication middleware using JWT
 * Extends from 001-admin-user feature
 *
 * NOTE: This is a placeholder implementation
 * Full implementation would include:
 * - JWT token verification using @fastify/jwt
 * - User lookup from token
 * - Session validation
 */

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: 'admin' | 'editor' | 'member';
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

/**
 * Verify JWT token and attach user to request
 */
export async function authenticateRequest(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // TODO: Implement actual JWT verification when @fastify/jwt is configured
    // For now, this is a placeholder that would:
    // 1. Extract token from Authorization header or cookies
    // 2. Verify token using fastify.jwt.verify()
    // 3. Look up user from database
    // 4. Attach user to request

    // Placeholder: Check for Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedError('No authorization token provided');
    }

    // This would be replaced with actual JWT verification
    // request.user = await verifyAndDecodeJWT(authHeader);

    throw new UnauthorizedError('Authentication not fully implemented yet - requires JWT setup from 001-admin-user');
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new UnauthorizedError('Invalid or expired token');
  }
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await authenticateRequest(request, reply);

  if (!request.user) {
    throw new UnauthorizedError('Authentication required');
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthenticatedUser | undefined, ...roles: Array<'admin' | 'editor' | 'member'>): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Middleware to require specific role
 */
export function requireRole(...roles: Array<'admin' | 'editor' | 'member'>) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await requireAuth(request, reply);

    if (!hasRole(request.user, ...roles)) {
      throw new UnauthorizedError(`Required role: ${roles.join(' or ')}`);
    }
  };
}
