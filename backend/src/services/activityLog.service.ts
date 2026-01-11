/**
 * Activity Log Service
 * From 001-admin-user feature
 * Tracks all administrative actions
 */

import prisma from '../utils/prisma';

export enum ActivityAction {
  UserCreated = 'user_created',
  UserUpdated = 'user_updated',
  UserDeleted = 'user_deleted',
  RoleChanged = 'role_changed',
  PermissionGranted = 'permission_granted',
  PermissionRevoked = 'permission_revoked',
  SeriesCreated = 'series_created',
  SeriesUpdated = 'series_updated',
  SeriesDeleted = 'series_deleted',
  ContentCreated = 'content_created',
  ContentUpdated = 'content_updated',
  ContentPublished = 'content_published',
  ContentArchived = 'content_archived',
  VersionCreated = 'version_created',
  VersionRestored = 'version_restored',
}

export interface ActivityLogEntry {
  id: number;
  timestamp: Date;
  admin_id: number;
  action: ActivityAction;
  target_entity_type: string;
  target_entity_id: number;
  changes?: any;
}

export interface CreateActivityLogInput {
  admin_id: number;
  action: ActivityAction;
  target_entity_type: string;
  target_entity_id: number;
  changes?: any;
}

/**
 * Log an activity
 */
export async function logActivity(input: CreateActivityLogInput): Promise<ActivityLogEntry> {
  const log = await prisma.activityLog.create({
    data: {
      admin_id: input.admin_id,
      action: input.action,
      target_entity_type: input.target_entity_type,
      target_entity_id: input.target_entity_id,
      changes: input.changes || null,
    },
  });

  return log as ActivityLogEntry;
}

/**
 * Get activity logs with optional filters
 */
export async function getActivityLogs(filters?: {
  admin_id?: number;
  action?: ActivityAction;
  target_entity_type?: string;
  target_entity_id?: number;
  limit?: number;
  offset?: number;
}): Promise<ActivityLogEntry[]> {
  const where: any = {};

  if (filters?.admin_id) {
    where.admin_id = filters.admin_id;
  }

  if (filters?.action) {
    where.action = filters.action;
  }

  if (filters?.target_entity_type) {
    where.target_entity_type = filters.target_entity_type;
  }

  if (filters?.target_entity_id) {
    where.target_entity_id = filters.target_entity_id;
  }

  const logs = await prisma.activityLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: filters?.limit || 100,
    skip: filters?.offset || 0,
    include: {
      admin: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return logs as any[];
}

/**
 * Get activity logs for a specific entity
 */
export async function getEntityActivityLogs(
  entityType: string,
  entityId: number,
  limit = 50
): Promise<ActivityLogEntry[]> {
  return getActivityLogs({
    target_entity_type: entityType,
    target_entity_id: entityId,
    limit,
  });
}

/**
 * Get recent activity for an admin user
 */
export async function getAdminActivity(adminId: number, limit = 50): Promise<ActivityLogEntry[]> {
  return getActivityLogs({
    admin_id: adminId,
    limit,
  });
}
