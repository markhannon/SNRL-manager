import { ContentSeries as PrismaContentSeries, SeriesStatus } from '@prisma/client';

/**
 * ContentSeries model type based on Prisma schema
 * Represents a collection of related content items (organizational hierarchy)
 */
export type ContentSeries = PrismaContentSeries;

/**
 * DTO for creating a new content series
 */
export interface CreateSeriesDTO {
  title: string;
  description?: string;
  created_by: number;
}

/**
 * DTO for updating an existing content series
 */
export interface UpdateSeriesDTO {
  title?: string;
  description?: string | null;
}

/**
 * DTO for series list response with content count
 */
export interface SeriesWithCount extends ContentSeries {
  content_count: number;
}

/**
 * Series list filter options
 */
export interface SeriesFilters {
  status?: SeriesStatus;
  created_by?: number;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Paginated series list response
 */
export interface PaginatedSeriesResponse {
  data: SeriesWithCount[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export { SeriesStatus };
