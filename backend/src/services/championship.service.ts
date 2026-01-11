/**
 * Championship Service
 * From 004-simracing-series feature
 * Handles championship CRUD operations
 */

import prisma from '../utils/prisma';
import { ValidationError, NotFoundError } from '../utils/errors';
import type {
  ChampionshipDTO,
  CreateChampionshipInput,
  UpdateChampionshipInput,
  ChampionshipFilters,
} from '../models/championship';

/**
 * Create a new championship
 */
export async function createChampionship(
  input: CreateChampionshipInput,
  userId: number
): Promise<ChampionshipDTO> {
  // Validate dates
  const seasonStart = new Date(input.seasonStart);
  const seasonEnd = new Date(input.seasonEnd);

  if (seasonEnd <= seasonStart) {
    throw new ValidationError('Season end date must be after season start date');
  }

  // Validate points scheme exists
  const pointsScheme = await prisma.pointsScheme.findUnique({
    where: { id: input.pointsSchemeId },
  });

  if (!pointsScheme) {
    throw new ValidationError('Points scheme not found');
  }

  // Create championship with allowed cars
  const championship = await prisma.championship.create({
    data: {
      name: input.name,
      description: input.description,
      simulator: input.simulator,
      seasonStart,
      seasonEnd,
      rulesText: input.rulesText,
      rulesDocumentUrl: input.rulesDocumentUrl,
      maxParticipants: input.maxParticipants,
      pointsSchemeId: input.pointsSchemeId,
      createdBy: userId,
      allowedCars: input.allowedCars
        ? {
            create: input.allowedCars.map((car) => ({
              carName: car.carName,
              carClass: car.carClass,
            })),
          }
        : undefined,
    },
    include: {
      pointsScheme: {
        select: {
          id: true,
          name: true,
        },
      },
      allowedCars: {
        select: {
          carName: true,
          carClass: true,
        },
      },
      _count: {
        select: {
          events: true,
        },
      },
    },
  });

  return toChampionshipDTO(championship);
}

/**
 * Get championship by ID
 */
export async function getChampionshipById(id: number): Promise<ChampionshipDTO> {
  const championship = await prisma.championship.findUnique({
    where: { id },
    include: {
      pointsScheme: {
        select: {
          id: true,
          name: true,
        },
      },
      allowedCars: {
        select: {
          carName: true,
          carClass: true,
        },
      },
      _count: {
        select: {
          events: true,
        },
      },
    },
  });

  if (!championship) {
    throw new NotFoundError('Championship not found');
  }

  return toChampionshipDTO(championship);
}

/**
 * Get all championships with optional filters
 */
export async function getChampionships(filters?: ChampionshipFilters): Promise<ChampionshipDTO[]> {
  const where: any = {};

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.simulator) {
    where.simulator = filters.simulator;
  }

  if (filters?.createdBy) {
    where.createdBy = filters.createdBy;
  }

  const championships = await prisma.championship.findMany({
    where,
    include: {
      pointsScheme: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          events: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return championships.map(toChampionshipDTO);
}

/**
 * Update championship
 */
export async function updateChampionship(
  id: number,
  input: UpdateChampionshipInput,
  userId: number
): Promise<ChampionshipDTO> {
  const championship = await prisma.championship.findUnique({
    where: { id },
  });

  if (!championship) {
    throw new NotFoundError('Championship not found');
  }

  // Verify ownership
  if (championship.createdBy !== userId) {
    throw new ValidationError('You do not have permission to update this championship');
  }

  // Validate dates if provided
  if (input.seasonStart || input.seasonEnd) {
    const seasonStart = input.seasonStart ? new Date(input.seasonStart) : championship.seasonStart;
    const seasonEnd = input.seasonEnd ? new Date(input.seasonEnd) : championship.seasonEnd;

    if (seasonEnd <= seasonStart) {
      throw new ValidationError('Season end date must be after season start date');
    }
  }

  // Validate points scheme if changed
  if (input.pointsSchemeId) {
    const pointsScheme = await prisma.pointsScheme.findUnique({
      where: { id: input.pointsSchemeId },
    });

    if (!pointsScheme) {
      throw new ValidationError('Points scheme not found');
    }
  }

  const updated = await prisma.championship.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      simulator: input.simulator,
      seasonStart: input.seasonStart ? new Date(input.seasonStart) : undefined,
      seasonEnd: input.seasonEnd ? new Date(input.seasonEnd) : undefined,
      status: input.status,
      rulesText: input.rulesText,
      rulesDocumentUrl: input.rulesDocumentUrl,
      maxParticipants: input.maxParticipants,
      pointsSchemeId: input.pointsSchemeId,
    },
    include: {
      pointsScheme: {
        select: {
          id: true,
          name: true,
        },
      },
      allowedCars: {
        select: {
          carName: true,
          carClass: true,
        },
      },
      _count: {
        select: {
          events: true,
        },
      },
    },
  });

  return toChampionshipDTO(updated);
}

/**
 * Delete championship
 */
export async function deleteChampionship(id: number, userId: number): Promise<void> {
  const championship = await prisma.championship.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          events: true,
        },
      },
    },
  });

  if (!championship) {
    throw new NotFoundError('Championship not found');
  }

  // Verify ownership
  if (championship.createdBy !== userId) {
    throw new ValidationError('You do not have permission to delete this championship');
  }

  // Prevent deletion if events exist
  if (championship._count.events > 0) {
    throw new ValidationError(
      'Cannot delete championship with existing events. Please delete all events first.'
    );
  }

  await prisma.championship.delete({
    where: { id },
  });
}

/**
 * Convert Prisma championship to DTO
 */
function toChampionshipDTO(championship: any): ChampionshipDTO {
  return {
    id: championship.id,
    name: championship.name,
    description: championship.description,
    simulator: championship.simulator,
    seasonStart: championship.seasonStart.toISOString().split('T')[0],
    seasonEnd: championship.seasonEnd.toISOString().split('T')[0],
    status: championship.status,
    rulesText: championship.rulesText,
    rulesDocumentUrl: championship.rulesDocumentUrl,
    maxParticipants: championship.maxParticipants,
    pointsScheme: championship.pointsScheme
      ? {
          id: championship.pointsScheme.id,
          name: championship.pointsScheme.name,
        }
      : undefined,
    allowedCars: championship.allowedCars,
    eventCount: championship._count?.events,
    createdBy: championship.createdBy,
    createdAt: championship.createdAt.toISOString(),
    updatedAt: championship.updatedAt.toISOString(),
  };
}
