import { BodyStyle, NhtsaVinDecodeResult } from '@/types/vehicle';
import { validateVin } from './vinValidator';

const NHTSA_BASE_URL = import.meta.env.VITE_NHTSA_API_URL || 'https://vpic.nhtsa.dot.gov/api';

/**
 * Maps NHTSA BodyClass and VehicleType strings into Smart Capture standardized BodyStyle
 */
export function mapNhtsaToBodyStyle(bodyClass?: string, vehicleType?: string): BodyStyle {
  if (!bodyClass && !vehicleType) return 'sedan';

  const normalized = `${bodyClass || ''} ${vehicleType || ''}`.toLowerCase();

  if (
    normalized.includes('pickup') ||
    normalized.includes('truck') ||
    normalized.includes('crew cab') ||
    normalized.includes('extended cab') ||
    normalized.includes('regular cab')
  ) {
    return 'truck';
  }
  if (
    normalized.includes('sport utility') ||
    normalized.includes('suv') ||
    normalized.includes('crossover')
  ) {
    return 'suv';
  }
  if (normalized.includes('coupe')) {
    return 'coupe';
  }
  if (normalized.includes('convertible') || normalized.includes('cabriolet')) {
    return 'convertible';
  }
  if (normalized.includes('van') || normalized.includes('minivan')) {
    return 'van';
  }
  if (normalized.includes('hatchback')) {
    return 'hatchback';
  }
  if (normalized.includes('wagon')) {
    return 'wagon';
  }
  if (normalized.includes('sedan') || normalized.includes('saloon')) {
    return 'sedan';
  }

  return 'other';
}

/**
 * Fetches and decodes vehicle specifications using the official NHTSA vPIC Public API.
 */
export async function decodeVinWithNhtsa(vin: string): Promise<NhtsaVinDecodeResult> {
  const validation = validateVin(vin);
  const cleanVin = validation.cleanVin;

  try {
    const response = await fetch(
      `${NHTSA_BASE_URL}/vehicles/DecodeVinValues/${cleanVin}?format=json`,
      {
        headers: { Accept: 'application/json' },
      }
    );

    if (!response.ok) {
      throw new Error(`NHTSA vPIC API returned status ${response.status}`);
    }

    const data = await response.json();
    const result = data?.Results?.[0];

    if (!result) {
      return {
        vin: cleanVin,
        isValid: validation.isValid,
        suggestedBodyStyle: 'sedan',
        errorCode: 'NO_RESULTS',
        errorText: 'No vehicle records returned from NHTSA.',
      };
    }

    const year = result.ModelYear ? parseInt(result.ModelYear, 10) : undefined;
    const make = result.Make?.trim() || undefined;
    const model = result.Model?.trim() || undefined;
    const trim = result.Trim?.trim() || undefined;
    const bodyClass = result.BodyClass?.trim() || undefined;
    const vehicleType = result.VehicleType?.trim() || undefined;
    const suggestedBodyStyle = mapNhtsaToBodyStyle(bodyClass, vehicleType);

    return {
      vin: cleanVin,
      isValid: validation.isValid,
      year: isNaN(Number(year)) ? undefined : year,
      make,
      model,
      trim,
      bodyClass,
      vehicleType,
      manufacturer: result.Manufacturer?.trim() || undefined,
      plantCountry: result.PlantCountry?.trim() || undefined,
      suggestedBodyStyle,
      errorCode: result.ErrorCode,
      errorText: result.ErrorText,
      raw: result,
    };
  } catch (error) {
    return {
      vin: cleanVin,
      isValid: validation.isValid,
      suggestedBodyStyle: 'sedan',
      errorCode: 'NETWORK_ERROR',
      errorText: error instanceof Error ? error.message : 'Failed to connect to NHTSA API',
    };
  }
}
