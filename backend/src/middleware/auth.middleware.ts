import { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError } from '../utils/errors';
import prisma from '../utils/prisma';

/**
 * Authentication middleware using JWT
 * From 001-admin-user feature
 */

export type UserRole = 'admin' | 'editor' | 'member';

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: UserRole;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: UserRole;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JWTPayload;
    user: JWTPayload;
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
    // Try to get token from Authorization header or cookie
    let token: string | undefined;

    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (request.cookies?.token) {
      token = request.cookies.token;
    }

    if (!token) {
      throw new UnauthorizedError('No authorization token provided');
    }

    // Verify JWT token
    const decoded = request.server.jwt.verify<JWTPayload>(token);

    // Validate user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedError('User account is not active');
    }

    // Attach user to request
    request.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
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
export function hasRole(user: AuthenticatedUser | undefined, ...roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Middleware to require specific role
 */
export function requireRole(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await requireAuth(request, reply);

    if (!hasRole(request.user, ...roles)) {
      throw new UnauthorizedError(`Required role: ${roles.join(' or ')}`);
    }
  };
}
