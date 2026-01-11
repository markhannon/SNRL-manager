/**
 * Event model types and DTOs
 * From 004-simracing-series feature - User Story 2
 */

export enum EventStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum RaceLengthUnit {
  LAPS = 'LAPS',
  MINUTES = 'MINUTES',
  HOURS = 'HOURS',
}

export interface Event {
  id: number;
  championshipId: number;
  name: string;
  track: string;
  eventDate: Date;
  status: EventStatus;
  raceLengthValue: number;
  raceLengthUnit: RaceLengthUnit;
  originalEventDate?: Date;
  cancellationReason?: string;
  cancelledAt?: Date;
  cancelledBy?: number;
  rescheduleDateHistory?: any;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventDTO {
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

export interface CreateEventInput {
  name: string;
  track: string;
  eventDate: string;
  raceLengthValue: number;
  raceLengthUnit: RaceLengthUnit;
}

export interface UpdateEventInput {
  name?: string;
  track?: string;
  eventDate?: string;
  status?: EventStatus;
  raceLengthValue?: number;
  raceLengthUnit?: RaceLengthUnit;
  cancellationReason?: string;
}

export interface EventFilters {
  championshipId?: number;
  status?: EventStatus;
  startDate?: string;
  endDate?: string;
}
