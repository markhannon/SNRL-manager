/**
 * PointsScheme Service
 * From 004-simracing-series feature
 * Handles points scheme CRUD operations
 */

import prisma from '../utils/prisma';
import { ValidationError, NotFoundError } from '../utils/errors';
import type {
  PointsSchemeDTO,
  CreatePointsSchemeInput,
  UpdatePointsSchemeInput,
} from '../models/pointsScheme';

/**
 * Create a new points scheme
 */
export async function createPointsScheme(
  input: CreatePointsSchemeInput,
  userId: number
): Promise<PointsSchemeDTO> {
  // Validate points mapping
  if (!input.pointsMapping || Object.keys(input.pointsMapping).length === 0) {
    throw new ValidationError('Points mapping cannot be empty');
  }

  // Validate all values are positive numbers
  for (const [position, points] of Object.entries(input.pointsMapping)) {
    if (typeof points !== 'number' || points < 0) {
      throw new ValidationError(`Invalid points value for position ${position}`);
    }
  }

  // Validate bonus points if provided
  if (input.bonusPoints) {
    for (const [bonus, points] of Object.entries(input.bonusPoints)) {
      if (typeof points !== 'number' || points < 0) {
        throw new ValidationError(`Invalid bonus points value for ${bonus}`);
      }
    }
  }

  const pointsScheme = await prisma.pointsScheme.create({
    data: {
      name: input.name,
      description: input.description,
      pointsMapping: input.pointsMapping,
      bonusPoints: input.bonusPoints,
      dropScores: input.dropScores ?? 0,
      createdBy: userId,
    },
  });

  return toPointsSchemeDTO(pointsScheme);
}

/**
 * Get points scheme by ID
 */
export async function getPointsSchemeById(id: number): Promise<PointsSchemeDTO> {
  const pointsScheme = await prisma.pointsScheme.findUnique({
    where: { id },
  });

  if (!pointsScheme) {
    throw new NotFoundError('Points scheme not found');
  }

  return toPointsSchemeDTO(pointsScheme);
}

/**
 * Get all points schemes
 */
export async function getPointsSchemes(): Promise<PointsSchemeDTO[]> {
  const schemes = await prisma.pointsScheme.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return schemes.map(toPointsSchemeDTO);
}

/**
 * Update points scheme
 */
export async function updatePointsScheme(
  id: number,
  input: UpdatePointsSchemeInput,
  userId: number
): Promise<PointsSchemeDTO> {
  const pointsScheme = await prisma.pointsScheme.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          championships: true,
        },
      },
    },
  });

  if (!pointsScheme) {
    throw new NotFoundError('Points scheme not found');
  }

  // Verify ownership
  if (pointsScheme.createdBy !== userId) {
    throw new ValidationError('You do not have permission to update this points scheme');
  }

  // Prevent modification if in use by championships
  if (pointsScheme._count.championships > 0) {
    throw new ValidationError(
      'Cannot modify points scheme that is in use by championships. Create a new scheme instead.'
    );
  }

  // Validate points mapping if provided
  if (input.pointsMapping) {
    if (Object.keys(input.pointsMapping).length === 0) {
      throw new ValidationError('Points mapping cannot be empty');
    }

    for (const [position, points] of Object.entries(input.pointsMapping)) {
      if (typeof points !== 'number' || points < 0) {
        throw new ValidationError(`Invalid points value for position ${position}`);
      }
    }
  }

  // Validate bonus points if provided
  if (input.bonusPoints) {
    for (const [bonus, points] of Object.entries(input.bonusPoints)) {
      if (typeof points !== 'number' || points < 0) {
        throw new ValidationError(`Invalid bonus points value for ${bonus}`);
      }
    }
  }

  const updated = await prisma.pointsScheme.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      pointsMapping: input.pointsMapping,
      bonusPoints: input.bonusPoints,
      dropScores: input.dropScores,
    },
  });

  return toPointsSchemeDTO(updated);
}

/**
 * Delete points scheme
 */
export async function deletePointsScheme(id: number, userId: number): Promise<void> {
  const pointsScheme = await prisma.pointsScheme.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          championships: true,
        },
      },
    },
  });

  if (!pointsScheme) {
    throw new NotFoundError('Points scheme not found');
  }

  // Verify ownership
  if (pointsScheme.createdBy !== userId) {
    throw new ValidationError('You do not have permission to delete this points scheme');
  }

  // Prevent deletion if in use
  if (pointsScheme._count.championships > 0) {
    throw new ValidationError(
      'Cannot delete points scheme that is in use by championships. Delete the championships first.'
    );
  }

  await prisma.pointsScheme.delete({
    where: { id },
  });
}

/**
 * Convert Prisma points scheme to DTO
 */
function toPointsSchemeDTO(scheme: any): PointsSchemeDTO {
  return {
    id: scheme.id,
    name: scheme.name,
    description: scheme.description,
    pointsMapping: scheme.pointsMapping as Record<string, number>,
    bonusPoints: scheme.bonusPoints as Record<string, number> | undefined,
    dropScores: scheme.dropScores,
    createdBy: scheme.createdBy,
    createdAt: scheme.createdAt.toISOString(),
    updatedAt: scheme.updatedAt.toISOString(),
  };
}
