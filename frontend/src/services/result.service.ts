/**
 * Frontend Result Service
 * From 004-simracing-series feature - User Story 4
 */

export type ResultStatus = 'CLASSIFIED' | 'DNF' | 'DNS' | 'DSQ';

export interface EventResult {
  id: number;
  eventId: number;
  driverId: number;
  driverEmail?: string;
  finishingPosition?: number;
  originalPosition?: number;
  resultStatus: ResultStatus;
  penalties?: Array<{
    type: 'TIME_PENALTY' | 'POSITION_PENALTY' | 'POINTS_DEDUCTION';
    value: number;
    reason: string;
  }>;
  pointsAwarded: number;
  isDraft: boolean;
  publishedAt?: string;
  enteredBy: number;
  createdAt: string;
  updatedAt: string;
  modificationHistory?: any;
}

export interface EnterResultInput {
  driverId: number;
  finishingPosition?: number;
  resultStatus: ResultStatus;
  penalties?: Array<{
    type: 'TIME_PENALTY' | 'POSITION_PENALTY' | 'POINTS_DEDUCTION';
    value: number;
    reason: string;
  }>;
}

export interface BatchResultsRequest {
  results: EnterResultInput[];
}

const API_BASE = '/api';

/**
 * Enter results for an event (batch)
 */
export async function enterResults(
  eventId: number,
  data: BatchResultsRequest
): Promise<EventResult[]> {
  const response = await fetch(`${API_BASE}/events/${eventId}/results`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to enter results');
  }

  return response.json();
}

/**
 * Get results for an event
 */
export async function getResultsByEvent(eventId: number): Promise<EventResult[]> {
  const response = await fetch(`${API_BASE}/events/${eventId}/results`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch results');
  }

  return response.json();
}

/**
 * Update a single result
 */
export async function updateResult(
  eventId: number,
  resultId: number,
  data: {
    finishingPosition?: number;
    resultStatus?: ResultStatus;
    penalties?: Array<{
      type: 'TIME_PENALTY' | 'POSITION_PENALTY' | 'POINTS_DEDUCTION';
      value: number;
      reason: string;
    }>;
  }
): Promise<EventResult> {
  const response = await fetch(`${API_BASE}/events/${eventId}/results/${resultId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update result');
  }

  return response.json();
}

/**
 * Publish results (finalize and recalculate standings)
 */
export async function publishResults(eventId: number): Promise<EventResult[]> {
  const response = await fetch(`${API_BASE}/events/${eventId}/results/publish`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to publish results');
  }

  return response.json();
}
