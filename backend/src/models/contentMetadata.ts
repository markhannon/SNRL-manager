import { ContentMetadata as PrismaContentMetadata } from '@prisma/client';

/**
 * ContentMetadata model type based on Prisma schema
 * Tracks view counts and analytics for content performance
 */
export type ContentMetadata = PrismaContentMetadata;

/**
 * DTO for recording a content view
 */
export interface RecordViewDTO {
  content_item_id: number;
  viewer_id?: number; // For tracking unique viewers
  session_id?: string; // For anonymous tracking
}

/**
 * DTO for content analytics
 */
export interface ContentAnalytics {
  content_item_id: number;
  view_count: number;
  unique_viewer_count: number;
  last_viewed_at: Date | null;
  average_views_per_day?: number;
}

/**
 * DTO for series analytics aggregation
 */
export interface SeriesAnalytics {
  series_id: number;
  total_content: number;
  total_views: number;
  total_unique_viewers: number;
  most_viewed_content: Array<{
    content_item_id: number;
    title: string;
    view_count: number;
  }>;
  recent_activity: Array<{
    content_item_id: number;
    title: string;
    last_viewed_at: Date;
  }>;
}
