/**
 * Frontend Event Service
 * From 004-simracing-series feature - User Story 2
 */

export type EventStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type RaceLengthUnit = 'LAPS' | 'MINUTES' | 'HOURS';

export interface Event {
  id: number;
  championshipId: number;
  name: string;
  track: string;
  eventDate: string;
  status: EventStatus;
  raceLengthValue: number;
  raceLengthUnit: RaceLengthUnit;
  originalEventDate?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: number;
  rescheduleDateHistory?: any;
  sessionCount?: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventRequest {
  name: string;
  track: string;
  eventDate: string;
  raceLengthValue: number;
  raceLengthUnit: RaceLengthUnit;
}

export interface UpdateEventRequest {
  name?: string;
  track?: string;
  eventDate?: string;
  status?: EventStatus;
  raceLengthValue?: number;
  raceLengthUnit?: RaceLengthUnit;
  cancellationReason?: string;
}

const API_BASE = '/api';

/**
 * Create a new event for a championship
 */
export async function createEvent(
  championshipId: number,
  data: CreateEventRequest
): Promise<Event> {
  const response = await fetch(`${API_BASE}/championships/${championshipId}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create event');
  }

  return response.json();
}

/**
 * Get events for a championship
 */
export async function getEventsByChampionship(
  championshipId: number,
  params: {
    status?: EventStatus;
    startDate?: string;
    endDate?: string;
  } = {}
): Promise<Event[]> {
  const queryParams = new URLSearchParams();

  if (params.status) queryParams.append('status', params.status);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);

  const url = queryParams.toString()
    ? `${API_BASE}/championships/${championshipId}/events?${queryParams}`
    : `${API_BASE}/championships/${championshipId}/events`;

  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch events');
  }

  return response.json();
}

/**
 * Get single event by ID
 */
export async function getEventById(id: number): Promise<Event> {
  const response = await fetch(`${API_BASE}/events/${id}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch event');
  }

  return response.json();
}

/**
 * Update event
 */
export async function updateEvent(id: number, data: UpdateEventRequest): Promise<Event> {
  const response = await fetch(`${API_BASE}/events/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update event');
  }

  return response.json();
}

/**
 * Delete event
 */
export async function deleteEvent(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/events/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete event');
  }
}
