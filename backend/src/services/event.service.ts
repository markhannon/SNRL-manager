/**
 * Event Service
 * From 004-simracing-series feature - User Story 2
 * Handles event CRUD operations
 */

import prisma from '../utils/prisma';
import { ValidationError, NotFoundError } from '../utils/errors';
import type {
  EventDTO,
  CreateEventInput,
  UpdateEventInput,
  EventFilters,
} from '../models/event';

/**
 * Create a new event for a championship
 */
export async function createEvent(
  championshipId: number,
  input: CreateEventInput,
  userId: number
): Promise<EventDTO> {
  // Verify championship exists and user has permission
  const championship = await prisma.championship.findUnique({
    where: { id: championshipId },
  });

  if (!championship) {
    throw new NotFoundError('Championship not found');
  }

  if (championship.createdBy !== userId) {
    throw new ValidationError('You do not have permission to add events to this championship');
  }

  // Validate event date is within championship season
  const eventDate = new Date(input.eventDate);
  const seasonStart = new Date(championship.seasonStart);
  const seasonEnd = new Date(championship.seasonEnd);

  if (eventDate < seasonStart || eventDate > seasonEnd) {
    throw new ValidationError(
      `Event date must be within championship season (${seasonStart.toISOString().split('T')[0]} to ${seasonEnd.toISOString().split('T')[0]})`
    );
  }

  // Validate race length
  if (input.raceLengthValue <= 0) {
    throw new ValidationError('Race length must be greater than 0');
  }

  const event = await prisma.event.create({
    data: {
      championshipId,
      name: input.name,
      track: input.track,
      eventDate,
      raceLengthValue: input.raceLengthValue,
      raceLengthUnit: input.raceLengthUnit,
      createdBy: userId,
    },
    include: {
      _count: {
        select: {
          raceSessions: true,
        },
      },
    },
  });

  return toEventDTO(event);
}

/**
 * Get events for a championship
 */
export async function getEventsByChampionship(
  championshipId: number,
  filters?: EventFilters
): Promise<EventDTO[]> {
  const where: any = { championshipId };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.startDate || filters?.endDate) {
    where.eventDate = {};
    if (filters.startDate) {
      where.eventDate.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.eventDate.lte = new Date(filters.endDate);
    }
  }

  const events = await prisma.event.findMany({
    where,
    include: {
      _count: {
        select: {
          raceSessions: true,
        },
      },
    },
    orderBy: { eventDate: 'asc' },
  });

  return events.map(toEventDTO);
}

/**
 * Get event by ID
 */
export async function getEventById(id: number): Promise<EventDTO> {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          raceSessions: true,
        },
      },
    },
  });

  if (!event) {
    throw new NotFoundError('Event not found');
  }

  return toEventDTO(event);
}

/**
 * Update event
 */
export async function updateEvent(
  id: number,
  input: UpdateEventInput,
  userId: number
): Promise<EventDTO> {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      championship: true,
    },
  });

  if (!event) {
    throw new NotFoundError('Event not found');
  }

  // Verify ownership
  if (event.championship.createdBy !== userId) {
    throw new ValidationError('You do not have permission to update this event');
  }

  // If updating event date, validate it's within championship season
  if (input.eventDate) {
    const newEventDate = new Date(input.eventDate);
    const seasonStart = new Date(event.championship.seasonStart);
    const seasonEnd = new Date(event.championship.seasonEnd);

    if (newEventDate < seasonStart || newEventDate > seasonEnd) {
      throw new ValidationError(
        `Event date must be within championship season (${seasonStart.toISOString().split('T')[0]} to ${seasonEnd.toISOString().split('T')[0]})`
      );
    }
  }

  // Validate race length if provided
  if (input.raceLengthValue !== undefined && input.raceLengthValue <= 0) {
    throw new ValidationError('Race length must be greater than 0');
  }

  // If cancelling, record the cancellation details
  const updateData: any = {
    name: input.name,
    track: input.track,
    eventDate: input.eventDate ? new Date(input.eventDate) : undefined,
    status: input.status,
    raceLengthValue: input.raceLengthValue,
    raceLengthUnit: input.raceLengthUnit,
    cancellationReason: input.cancellationReason,
  };

  if (input.status === 'CANCELLED' && event.status !== 'CANCELLED') {
    updateData.cancelledAt = new Date();
    updateData.cancelledBy = userId;
  }

  const updated = await prisma.event.update({
    where: { id },
    data: updateData,
    include: {
      _count: {
        select: {
          raceSessions: true,
        },
      },
    },
  });

  return toEventDTO(updated);
}

/**
 * Delete event
 */
export async function deleteEvent(id: number, userId: number): Promise<void> {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      championship: true,
      _count: {
        select: {
          results: true,
          raceSessions: true,
        },
      },
    },
  });

  if (!event) {
    throw new NotFoundError('Event not found');
  }

  // Verify ownership
  if (event.championship.createdBy !== userId) {
    throw new ValidationError('You do not have permission to delete this event');
  }

  // Prevent deletion if results exist
  if (event._count.results > 0) {
    throw new ValidationError(
      'Cannot delete event with existing results. Please delete all results first.'
    );
  }

  await prisma.event.delete({
    where: { id },
  });
}

/**
 * Convert Prisma event to DTO
 */
function toEventDTO(event: any): EventDTO {
  return {
    id: event.id,
    championshipId: event.championshipId,
    name: event.name,
    track: event.track,
    eventDate: event.eventDate.toISOString().split('T')[0],
    status: event.status,
    raceLengthValue: event.raceLengthValue,
    raceLengthUnit: event.raceLengthUnit,
    originalEventDate: event.originalEventDate
      ? event.originalEventDate.toISOString().split('T')[0]
      : undefined,
    cancellationReason: event.cancellationReason,
    cancelledAt: event.cancelledAt ? event.cancelledAt.toISOString() : undefined,
    cancelledBy: event.cancelledBy,
    rescheduleDateHistory: event.rescheduleDateHistory,
    sessionCount: event._count?.raceSessions,
    createdBy: event.createdBy,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}
