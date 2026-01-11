import { FastifyRequest } from 'fastify';
import { ForbiddenError } from '../utils/errors';
import { AuthenticatedUser, hasRole } from './auth.middleware';
import prisma from '../utils/prisma';

/**
 * Authorization middleware for content management
 * Extends from 001-admin-user to check series-specific Editor permissions
 */

/**
 * Check if user has Editor permission for a specific series
 * - Admins have permission for all series
 * - Editors have permission for all series by default
 * - Members can have series-specific Editor permissions via SeriesPermission table
 */
export async function hasSeriesEditPermission(
  user: AuthenticatedUser,
  seriesId: number
): Promise<boolean> {
  // Admins and Editors have permission for all series
  if (hasRole(user, 'admin', 'editor')) {
    return true;
  }

  // Check if Member has series-specific permission
  if (user.role === 'member') {
    const permission = await prisma.seriesPermission.findFirst({
      where: {
        user_id: user.id,
        series_id: seriesId,
        permission: 'editor',
      },
    });

    return permission !== null;
  }

  return false;
}

/**
 * Require Editor permission for a series
 * Throws ForbiddenError if user lacks permission
 */
export async function requireSeriesEditPermission(
  user: AuthenticatedUser | undefined,
  seriesId: number
): Promise<void> {
  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  const hasPermission = await hasSeriesEditPermission(user, seriesId);

  if (!hasPermission) {
    throw new ForbiddenError(`You do not have edit permission for this series`);
  }
}

/**
 * Check if user can create content (Admin or Editor role)
 */
export function canCreateContent(user: AuthenticatedUser | undefined): boolean {
  return !!user && hasRole(user, 'admin', 'editor');
}

/**
 * Check if user can edit specific content item
 * - Must have series edit permission
 */
export async function canEditContent(
  user: AuthenticatedUser | undefined,
  contentItem: { series_id: number; author_id: number }
): Promise<boolean> {
  if (!user) return false;

  // Check series permission
  return await hasSeriesEditPermission(user, contentItem.series_id);
}

/**
 * Check if user can publish content
 * Same as edit permission (Admin, Editor, or series-specific Editor)
 */
export async function canPublishContent(
  user: AuthenticatedUser | undefined,
  seriesId: number
): Promise<boolean> {
  if (!user) return false;
  return await hasSeriesEditPermission(user, seriesId);
}

/**
 * Require Admin or Editor role for series/content creation
 */
export function requireEditorRole(user: AuthenticatedUser | undefined): void {
  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  if (!hasRole(user, 'admin', 'editor')) {
    throw new ForbiddenError('Admin or Editor role required');
  }
}

/**
 * Extract series ID from request params or body
 */
export function extractSeriesId(request: FastifyRequest): number {
  const params = request.params as any;
  const body = request.body as any;

  const seriesId = params?.seriesId || params?.id || body?.series_id;

  if (!seriesId) {
    throw new ForbiddenError('Series ID not found in request');
  }

  return parseInt(seriesId, 10);
}
