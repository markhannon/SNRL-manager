/**
 * PointsScheme model types and DTOs
 * From 004-simracing-series feature
 */

export interface PointsScheme {
  id: number;
  name: string;
  description?: string;
  pointsMapping: Record<string, number>; // { "1": 25, "2": 18, ... }
  bonusPoints?: Record<string, number>; // { "fastestLap": 1, "polePosition": 1 }
  dropScores: number;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PointsSchemeDTO {
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

export interface CreatePointsSchemeInput {
  name: string;
  description?: string;
  pointsMapping: Record<string, number>;
  bonusPoints?: Record<string, number>;
  dropScores?: number;
}

export interface UpdatePointsSchemeInput {
  name?: string;
  description?: string;
  pointsMapping?: Record<string, number>;
  bonusPoints?: Record<string, number>;
  dropScores?: number;
}

// Predefined points schemes
export const PREDEFINED_SCHEMES = {
  F1_2024: {
    name: 'F1 2024',
    description: 'Formula 1 2024 points system',
    pointsMapping: {
      '1': 25,
      '2': 18,
      '3': 15,
      '4': 12,
      '5': 10,
      '6': 8,
      '7': 6,
      '8': 4,
      '9': 2,
      '10': 1,
    },
    bonusPoints: {
      fastestLap: 1,
    },
    dropScores: 0,
  },
  INDYCAR: {
    name: 'IndyCar',
    description: 'IndyCar points system',
    pointsMapping: {
      '1': 50,
      '2': 40,
      '3': 35,
      '4': 32,
      '5': 30,
      '6': 28,
      '7': 26,
      '8': 24,
      '9': 22,
      '10': 20,
      '11': 19,
      '12': 18,
    },
    bonusPoints: {
      polePosition: 1,
      leadLap: 1,
      mostLapsLed: 2,
    },
    dropScores: 0,
  },
  NASCAR: {
    name: 'NASCAR',
    description: 'NASCAR Cup Series points system',
    pointsMapping: {
      '1': 40,
      '2': 35,
      '3': 34,
      '4': 33,
      '5': 32,
      '6': 31,
      '7': 30,
      '8': 29,
      '9': 28,
      '10': 27,
    },
    bonusPoints: {},
    dropScores: 0,
  },
};
