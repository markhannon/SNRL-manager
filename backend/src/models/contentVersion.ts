import { ContentVersion as PrismaContentVersion } from '@prisma/client';

/**
 * ContentVersion model type based on Prisma schema
 * Represents an immutable version snapshot of content for complete audit trail
 */
export type ContentVersion = PrismaContentVersion;

/**
 * DTO for creating a new content version
 */
export interface CreateVersionDTO {
  content_item_id: number;
  version_number: number;
  title: string;
  body: string;
  author_id: number;
  is_current: boolean;
}

/**
 * DTO for version with author information
 */
export interface VersionWithAuthor extends ContentVersion {
  author?: {
    id: number;
    email: string;
  };
}

/**
 * Version history response
 */
export interface VersionHistoryResponse {
  versions: VersionWithAuthor[];
  total: number;
}

/**
 * Version comparison result
 */
export interface VersionComparison {
  old_version: ContentVersion;
  new_version: ContentVersion;
  title_changed: boolean;
  body_changed: boolean;
}
