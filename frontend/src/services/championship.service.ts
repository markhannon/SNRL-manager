/**
 * Frontend Championship Service
 * From 004-simracing-series feature
 */

export type ChampionshipStatus = 'DRAFT' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Championship {
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

export interface CreateChampionshipRequest {
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

export interface UpdateChampionshipRequest {
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

export interface PointsScheme {
  id: number;
  name: string;
  description?: string;
  pointsMapping: Record<string, number>;
  bonusPoints?: Record<string, number>;
  dropScores: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePointsSchemeRequest {
  name: string;
  description?: string;
  pointsMapping: Record<string, number>;
  bonusPoints?: Record<string, number>;
  dropScores?: number;
}

export interface PredefinedSchemes {
  F1_2024: {
    name: string;
    description: string;
    pointsMapping: Record<string, number>;
    bonusPoints: Record<string, number>;
    dropScores: number;
  };
  INDYCAR: {
    name: string;
    description: string;
    pointsMapping: Record<string, number>;
    bonusPoints: Record<string, number>;
    dropScores: number;
  };
  NASCAR: {
    name: string;
    description: string;
    pointsMapping: Record<string, number>;
    bonusPoints: Record<string, number>;
    dropScores: number;
  };
}

const API_BASE = '/api';

/**
 * Create a new championship
 */
export async function createChampionship(data: CreateChampionshipRequest): Promise<Championship> {
  const response = await fetch(`${API_BASE}/championships`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create championship');
  }

  return response.json();
}

/**
 * Get championships list with optional filters
 */
export async function getChampionships(params: {
  status?: ChampionshipStatus;
  simulator?: string;
  createdBy?: number;
} = {}): Promise<Championship[]> {
  const queryParams = new URLSearchParams();

  if (params.status) queryParams.append('status', params.status);
  if (params.simulator) queryParams.append('simulator', params.simulator);
  if (params.createdBy) queryParams.append('createdBy', params.createdBy.toString());

  const url = queryParams.toString()
    ? `${API_BASE}/championships?${queryParams}`
    : `${API_BASE}/championships`;

  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch championships');
  }

  return response.json();
}

/**
 * Get single championship by ID
 */
export async function getChampionshipById(id: number): Promise<Championship> {
  const response = await fetch(`${API_BASE}/championships/${id}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch championship');
  }

  return response.json();
}

/**
 * Update championship
 */
export async function updateChampionship(
  id: number,
  data: UpdateChampionshipRequest
): Promise<Championship> {
  const response = await fetch(`${API_BASE}/championships/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update championship');
  }

  return response.json();
}

/**
 * Delete championship
 */
export async function deleteChampionship(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/championships/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete championship');
  }
}

/**
 * Get predefined points schemes
 */
export async function getPredefinedSchemes(): Promise<PredefinedSchemes> {
  const response = await fetch(`${API_BASE}/points-schemes/predefined`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch predefined schemes');
  }

  return response.json();
}

/**
 * Get all points schemes
 */
export async function getPointsSchemes(): Promise<PointsScheme[]> {
  const response = await fetch(`${API_BASE}/points-schemes`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch points schemes');
  }

  return response.json();
}

/**
 * Create a new points scheme
 */
export async function createPointsScheme(data: CreatePointsSchemeRequest): Promise<PointsScheme> {
  const response = await fetch(`${API_BASE}/points-schemes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create points scheme');
  }

  return response.json();
}
