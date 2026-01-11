import { ContentItem as PrismaContentItem, ContentStatus } from '@prisma/client';

/**
 * ContentItem model type based on Prisma schema
 * Represents individual content with lifecycle management (draft/published/archived)
 */
export type ContentItem = PrismaContentItem;

/**
 * DTO for creating a new content item
 */
export interface CreateContentDTO {
  series_id: number;
  title: string;
  body: string;
  author_id: number;
}

/**
 * DTO for updating an existing content item
 */
export interface UpdateContentDTO {
  title?: string;
  body?: string;
}

/**
 * DTO for content item with series and author information
 */
export interface ContentItemWithRelations extends ContentItem {
  series?: {
    id: number;
    title: string;
  };
  author?: {
    id: number;
    email: string;
  };
  _count?: {
    versions: number;
  };
}

/**
 * Content list filter options
 */
export interface ContentFilters {
  series_id?: number;
  author_id?: number;
  status?: ContentStatus;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Paginated content list response
 */
export interface PaginatedContentResponse {
  data: ContentItemWithRelations[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export { ContentStatus };
