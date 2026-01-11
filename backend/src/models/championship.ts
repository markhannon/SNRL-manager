/**
 * Championship model types and DTOs
 * From 004-simracing-series feature
 */

export enum ChampionshipStatus {
  DRAFT = 'DRAFT',
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Championship {
  id: number;
  name: string;
  description?: string;
  simulator: string;
  seasonStart: Date;
  seasonEnd: Date;
  status: ChampionshipStatus;
  rulesText?: string;
  rulesDocumentUrl?: string;
  maxParticipants?: number;
  pointsSchemeId: number;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChampionshipDTO {
  id: number;
  name: string;
  description?: string;
  simulator: string;
  seasonStart: string;
  seasonEnd: string;
  status: ChampionshipStatus;
  rulesText?: string;
  rulesDocumentUrl?: string;
  maxParticipants?: number;
  pointsScheme?: {
    id: number;
    name: string;
  };
  allowedCars?: Array<{ carName: string; carClass?: string }>;
  eventCount?: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChampionshipInput {
  name: string;
  description?: string;
  simulator: string;
  seasonStart: string;
  seasonEnd: string;
  rulesText?: string;
  rulesDocumentUrl?: string;
  maxParticipants?: number;
  pointsSchemeId: number;
  allowedCars?: Array<{ carName: string; carClass?: string }>;
}

export interface UpdateChampionshipInput {
  name?: string;
  description?: string;
  simulator?: string;
  seasonStart?: string;
  seasonEnd?: string;
  status?: ChampionshipStatus;
  rulesText?: string;
  rulesDocumentUrl?: string;
  maxParticipants?: number;
  pointsSchemeId?: number;
}

export interface ChampionshipFilters {
  status?: ChampionshipStatus;
  simulator?: string;
  createdBy?: number;
}
