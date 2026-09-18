import { LandAreaUnit } from '@/types/sell-form';

export const LAND_AREA_CONVERSIONS: Record<LandAreaUnit, number> = {
  SQUARE_YARDS: 1,
  SQUARE_FEET: 1 / 9,
  GUNTAS: 121,
  CENTS: 48.4,
  ACRES: 4840,
  HECTARES: 11959.9004,
};

export function convertToSquareYards(value: number, unit: LandAreaUnit): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value * LAND_AREA_CONVERSIONS[unit];
}

export function convertFromSquareYards(squareYards: number, unit: LandAreaUnit): number {
  if (!Number.isFinite(squareYards) || squareYards <= 0) return 0;
  return squareYards / LAND_AREA_CONVERSIONS[unit];
}
