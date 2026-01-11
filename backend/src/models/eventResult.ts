/**
 * EventResult model types and DTOs
 * From 004-simracing-series feature - User Story 4
 */

export enum ResultStatus {
  CLASSIFIED = 'CLASSIFIED',
  DNF = 'DNF',
  DNS = 'DNS',
  DSQ = 'DSQ',
}

export interface EventResult {
  id: number;
  eventId: number;
  driverId: number;
  finishingPosition?: number;
  originalPosition?: number;
  resultStatus: ResultStatus;
  penalties?: any;
  pointsAwarded: number;
  isDraft: boolean;
  publishedAt?: Date;
  enteredBy: number;
  createdAt: Date;
  updatedAt: Date;
  modificationHistory?: any;
}

export interface EventResultDTO {
  id: number;
  eventId: number;
  driverId: number;
  driverEmail?: string;
  finishingPosition?: number;
  originalPosition?: number;
  resultStatus: ResultStatus;
  penalties?: any;
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

export interface UpdateResultInput {
  finishingPosition?: number;
  resultStatus?: ResultStatus;
  penalties?: Array<{
    type: 'TIME_PENALTY' | 'POSITION_PENALTY' | 'POINTS_DEDUCTION';
    value: number;
    reason: string;
  }>;
}

export interface BatchResultsInput {
  results: EnterResultInput[];
}
