import prisma from '../utils/prisma';
import {
  CreateSeriesDTO,
  UpdateSeriesDTO,
  SeriesWithCount,
  SeriesFilters,
  PaginatedSeriesResponse,
  SeriesStatus
} from '../models/contentSeries';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { validateCreateSeries, validateSeriesTitle, validateSeriesDescription } from '../utils/validation';
import { logContentOperation } from '../utils/logger';

/**
 * SeriesService
 * Handles all business logic for ContentSeries management
 * User Story 1: Series Management
 */

/**
 * T017: Create a new content series
 * Validates title uniqueness and creates ContentSeries with created_by
 */
export async function createSeries(data: CreateSeriesDTO): Promise<SeriesWithCount> {
  // Validate input
  validateCreateSeries(data);

  // Check for duplicate title
  const existing = await prisma.contentSeries.findFirst({
    where: {
      title: data.title,
      status: 'active',
    },
  });

  if (existing) {
    throw new BadRequestError(`A series with title "${data.title}" already exists`);
  }

  // Create series
  const series = await prisma.contentSeries.create({
    data: {
      title: data.title,
      description: data.description || null,
      created_by: data.created_by,
      status: 'active',
    },
  });

  // Log operation
  logContentOperation('series_created', {
    userId: data.created_by,
    seriesId: series.id,
    title: series.title,
  });

  // Return with content count (0 for new series)
  return {
    ...series,
    content_count: 0,
  };
}

/**
 * T018: List series with pagination, search, and filters
 */
export async function listSeries(filters: SeriesFilters = {}): Promise<PaginatedSeriesResponse> {
  const {
    status = 'active',
    created_by,
    search,
    page = 1,
    limit = 20,
  } = filters;

  // Build where clause
  const where: any = {
    status,
  };

  if (created_by) {
    where.created_by = created_by;
  }

  if (search) {
    where.title = {
      contains: search,
      mode: 'insensitive',
    };
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Fetch series with content count
  const [series, total] = await Promise.all([
    prisma.contentSeries.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        _count: {
          select: {
            content: true,
          },
        },
      },
    }),
    prisma.contentSeries.count({ where }),
  ]);

  // Map to SeriesWithCount
  const data: SeriesWithCount[] = series.map(s => ({
    id: s.id,
    title: s.title,
    description: s.description,
    created_by: s.created_by,
    created_at: s.created_at,
    updated_at: s.updated_at,
    status: s.status,
    content_count: s._count.content,
  }));

  return {
    data,
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit),
  };
}

/**
 * T019: Get series by ID with content count
 */
export async function getSeries(id: number): Promise<SeriesWithCount> {
  const series = await prisma.contentSeries.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          content: true,
        },
      },
    },
  });

  if (!series) {
    throw new NotFoundError('Series', id);
  }

  return {
    id: series.id,
    title: series.title,
    description: series.description,
    created_by: series.created_by,
    created_at: series.created_at,
    updated_at: series.updated_at,
    status: series.status,
    content_count: series._count.content,
  };
}

/**
 * T020: Update series title/description
 * Requires Editor/Admin check (enforced in route layer)
 */
export async function updateSeries(
  id: number,
  data: UpdateSeriesDTO,
  userId: number
): Promise<SeriesWithCount> {
  // Validate input
  if (data.title) {
    validateSeriesTitle(data.title);
  }
  if (data.description !== undefined && data.description !== null) {
    validateSeriesDescription(data.description);
  }

  // Check series exists
  const existing = await prisma.contentSeries.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new NotFoundError('Series', id);
  }

  // Check for title conflict if title is being changed
  if (data.title && data.title !== existing.title) {
    const duplicate = await prisma.contentSeries.findFirst({
      where: {
        title: data.title,
        status: 'active',
        id: { not: id },
      },
    });

    if (duplicate) {
      throw new BadRequestError(`A series with title "${data.title}" already exists`);
    }
  }

  // Update series
  const updated = await prisma.contentSeries.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
    },
    include: {
      _count: {
        select: {
          content: true,
        },
      },
    },
  });

  // Log operation
  logContentOperation('series_updated', {
    userId,
    seriesId: id,
    changes: data,
  });

  return {
    id: updated.id,
    title: updated.title,
    description: updated.description,
    created_by: updated.created_by,
    created_at: updated.created_at,
    updated_at: updated.updated_at,
    status: updated.status,
    content_count: updated._count.content,
  };
}

/**
 * T021: Delete series (soft-delete)
 * Checks for content items and provides cascade warning
 */
export async function deleteSeries(id: number, userId: number): Promise<void> {
  // Check series exists
  const series = await prisma.contentSeries.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          content: true,
        },
      },
    },
  });

  if (!series) {
    throw new NotFoundError('Series', id);
  }

  if (series.status === 'deleted') {
    throw new BadRequestError('Series is already deleted');
  }

  // Soft-delete series (status = deleted)
  await prisma.contentSeries.update({
    where: { id },
    data: {
      status: 'deleted',
    },
  });

  // Log operation with content count for cascade awareness
  logContentOperation('series_deleted', {
    userId,
    seriesId: id,
    title: series.title,
    content_count: series._count.content,
    cascade_warning: series._count.content > 0
      ? `Series had ${series._count.content} content items`
      : undefined,
  });
}
