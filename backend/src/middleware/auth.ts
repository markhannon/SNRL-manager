/**
 * Auth middleware exports
 * Re-exports from auth.middleware.ts with convenient names
 */

export { requireAuth as authenticate, requireRole, hasRole, type AuthenticatedUser, type UserRole } from './auth.middleware';
