/**
 * Result Service
 * From 004-simracing-series feature - User Story 4
 * Handles race result entry and standings calculation
 */

import prisma from '../utils/prisma';
import { ValidationError, NotFoundError } from '../utils/errors';
import type {
  EventResultDTO,
  EnterResultInput,
  UpdateResultInput,
  BatchResultsInput,
} from '../models/eventResult';

/**
 * Enter results for an event (batch operation)
 */
export async function enterResults(
  eventId: number,
  input: BatchResultsInput,
  userId: number
): Promise<EventResultDTO[]> {
  // Verify event exists and user has permission
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      championship: {
        include: {
          pointsScheme: true,
        },
      },
    },
  });

  if (!event) {
    throw new NotFoundError('Event not found');
  }

  if (event.championship.createdBy !== userId) {
    throw new ValidationError('You do not have permission to enter results for this event');
  }

  // Validate unique positions for classified results
  const classifiedResults = input.results.filter((r) => r.resultStatus === 'CLASSIFIED');
  const positions = classifiedResults
    .map((r) => r.finishingPosition)
    .filter((p) => p !== undefined);
  if (new Set(positions).size !== positions.length) {
    throw new ValidationError('Duplicate finishing positions detected');
  }

  // Validate DNF/DNS/DSQ have null position
  for (const result of input.results) {
    if (
      ['DNF', 'DNS', 'DSQ'].includes(result.resultStatus) &&
      result.finishingPosition !== undefined
    ) {
      throw new ValidationError(`${result.resultStatus} results cannot have a finishing position`);
    }
  }

  // Delete existing draft results for this event
  await prisma.eventResult.deleteMany({
    where: { eventId, isDraft: true },
  });

  // Create results with points calculation
  const createdResults = await Promise.all(
    input.results.map(async (resultInput) => {
      const points = calculatePoints(
        resultInput,
        event.championship.pointsScheme.pointsMapping as Record<string, number>,
        event.championship.pointsScheme.bonusPoints as Record<string, number> | undefined
      );

      return prisma.eventResult.create({
        data: {
          eventId,
          driverId: resultInput.driverId,
          finishingPosition: resultInput.finishingPosition,
          originalPosition: resultInput.finishingPosition,
          resultStatus: resultInput.resultStatus,
          penalties: resultInput.penalties,
          pointsAwarded: points,
          isDraft: true,
          enteredBy: userId,
        },
        include: {
          driver: {
            select: {
              email: true,
            },
          },
        },
      });
    })
  );

  return createdResults.map(toEventResultDTO);
}

/**
 * Get results for an event
 */
export async function getResultsByEvent(eventId: number): Promise<EventResultDTO[]> {
  const results = await prisma.eventResult.findMany({
    where: { eventId },
    include: {
      driver: {
        select: {
          email: true,
        },
      },
    },
    orderBy: [{ resultStatus: 'asc' }, { finishingPosition: 'asc' }],
  });

  return results.map(toEventResultDTO);
}

/**
 * Update a single result
 */
export async function updateResult(
  eventId: number,
  resultId: number,
  input: UpdateResultInput,
  userId: number
): Promise<EventResultDTO> {
  const result = await prisma.eventResult.findFirst({
    where: { id: resultId, eventId },
    include: {
      event: {
        include: {
          championship: {
            include: {
              pointsScheme: true,
            },
          },
        },
      },
    },
  });

  if (!result) {
    throw new NotFoundError('Result not found');
  }

  if (result.event.championship.createdBy !== userId) {
    throw new ValidationError('You do not have permission to update this result');
  }

  if (!result.isDraft) {
    throw new ValidationError('Cannot modify published results. Unpublish first.');
  }

  // Validate position uniqueness if changing position
  if (input.finishingPosition && input.finishingPosition !== result.finishingPosition) {
    const existingResult = await prisma.eventResult.findFirst({
      where: {
        eventId,
        finishingPosition: input.finishingPosition,
        id: { not: resultId },
        resultStatus: 'CLASSIFIED',
      },
    });

    if (existingResult) {
      throw new ValidationError(`Position ${input.finishingPosition} is already taken`);
    }
  }

  // Recalculate points with new data
  const updatedResultInput: EnterResultInput = {
    driverId: result.driverId,
    finishingPosition: input.finishingPosition ?? result.finishingPosition,
    resultStatus: input.resultStatus ?? result.resultStatus,
    penalties: input.penalties ?? result.penalties,
  };

  const points = calculatePoints(
    updatedResultInput,
    result.event.championship.pointsScheme.pointsMapping as Record<string, number>,
    result.event.championship.pointsScheme.bonusPoints as Record<string, number> | undefined
  );

  // Add to modification history
  const modHistory = (result.modificationHistory as any[]) || [];
  modHistory.push({
    timestamp: new Date().toISOString(),
    userId,
    changes: input,
  });

  const updated = await prisma.eventResult.update({
    where: { id: resultId },
    data: {
      finishingPosition: input.finishingPosition,
      resultStatus: input.resultStatus,
      penalties: input.penalties,
      pointsAwarded: points,
      modificationHistory: modHistory,
    },
    include: {
      driver: {
        select: {
          email: true,
        },
      },
    },
  });

  return toEventResultDTO(updated);
}

/**
 * Publish results (finalize and trigger standings recalculation)
 */
export async function publishResults(eventId: number, userId: number): Promise<EventResultDTO[]> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      championship: true,
      results: true,
    },
  });

  if (!event) {
    throw new NotFoundError('Event not found');
  }

  if (event.championship.createdBy !== userId) {
    throw new ValidationError('You do not have permission to publish results for this event');
  }

  if (event.results.length === 0) {
    throw new ValidationError('No results to publish');
  }

  // Publish all draft results
  const publishedAt = new Date();
  await prisma.eventResult.updateMany({
    where: { eventId, isDraft: true },
    data: {
      isDraft: false,
      publishedAt,
    },
  });

  // Update event status to completed
  await prisma.event.update({
    where: { id: eventId },
    data: { status: 'COMPLETED' },
  });

  // Trigger standings recalculation
  await recalculateStandings(event.championshipId);

  return getResultsByEvent(eventId);
}

/**
 * Calculate points for a result based on points scheme
 */
function calculatePoints(
  result: EnterResultInput,
  pointsMapping: Record<string, number>,
  bonusPoints?: Record<string, number>
): number {
  // DNF, DNS, DSQ get 0 points
  if (['DNF', 'DNS', 'DSQ'].includes(result.resultStatus)) {
    return 0;
  }

  if (!result.finishingPosition) {
    return 0;
  }

  // Get base points from position
  let points = pointsMapping[result.finishingPosition.toString()] || 0;

  // Apply penalties
  if (result.penalties) {
    for (const penalty of result.penalties) {
      if (penalty.type === 'POINTS_DEDUCTION') {
        points = Math.max(0, points - penalty.value);
      }
    }
  }

  // TODO: Add bonus points logic (fastest lap, etc.) when that data is available

  return points;
}

/**
 * Recalculate championship standings
 */
async function recalculateStandings(championshipId: number): Promise<void> {
  // Get championship with points scheme and all published results
  const championship = await prisma.championship.findUnique({
    where: { id: championshipId },
    include: {
      pointsScheme: true,
      events: {
        include: {
          results: {
            where: { isDraft: false },
          },
        },
      },
      registrations: {
        where: { status: 'ACTIVE' },
      },
    },
  });

  if (!championship) return;

  // Calculate points for each driver
  const driverPoints = new Map<number, { totalPoints: number; results: any[] }>();

  for (const event of championship.events) {
    for (const result of event.results) {
      const current = driverPoints.get(result.driverId) || { totalPoints: 0, results: [] };
      current.totalPoints += result.pointsAwarded;
      current.results.push({
        eventId: event.id,
        points: result.pointsAwarded,
        position: result.finishingPosition,
        status: result.resultStatus,
      });
      driverPoints.set(result.driverId, current);
    }
  }

  // Apply drop scores if configured
  if (championship.pointsScheme.dropScores > 0) {
    for (const [driverId, data] of driverPoints.entries()) {
      // Sort results by points ascending and drop lowest N
      data.results.sort((a, b) => a.points - b.points);
      const resultsToDrop = data.results.slice(0, championship.pointsScheme.dropScores);
      const droppedPoints = resultsToDrop.reduce((sum, r) => sum + r.points, 0);
      data.totalPoints -= droppedPoints;
    }
  }

  // Sort drivers by points descending
  const sortedDrivers = Array.from(driverPoints.entries()).sort(
    ([, a], [, b]) => b.totalPoints - a.totalPoints
  );

  // Delete existing standings
  await prisma.championshipStanding.deleteMany({
    where: { championshipId },
  });

  // Create new standings
  let position = 1;
  for (const [driverId, data] of sortedDrivers) {
    const driverResults = data.results.filter((r) => r.status === 'CLASSIFIED');
    const wins = driverResults.filter((r) => r.position === 1).length;
    const podiums = driverResults.filter((r) => r.position && r.position <= 3).length;
    const bestFinish =
      driverResults.length > 0
        ? Math.min(...driverResults.filter((r) => r.position).map((r) => r.position))
        : undefined;

    await prisma.championshipStanding.create({
      data: {
        championshipId,
        driverId,
        position,
        totalPoints: data.totalPoints,
        eventsParticipated: data.results.length,
        wins,
        podiums,
        bestFinish,
        pointsBreakdown: data.results,
        lastCalculated: new Date(),
      },
    });

    position++;
  }
}

/**
 * Convert Prisma result to DTO
 */
function toEventResultDTO(result: any): EventResultDTO {
  return {
    id: result.id,
    eventId: result.eventId,
    driverId: result.driverId,
    driverEmail: result.driver?.email,
    finishingPosition: result.finishingPosition,
    originalPosition: result.originalPosition,
    resultStatus: result.resultStatus,
    penalties: result.penalties,
    pointsAwarded: result.pointsAwarded,
    isDraft: result.isDraft,
    publishedAt: result.publishedAt ? result.publishedAt.toISOString() : undefined,
    enteredBy: result.enteredBy,
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
    modificationHistory: result.modificationHistory,
  };
}
