import { describe, it, expect, vi } from 'vitest';
import { mapNhtsaToBodyStyle, decodeVinWithNhtsa } from '@/services/vin/nhtsaDecoder';

describe('NHTSA vPIC Decoder & Body Style Inference', () => {
  it('correctly maps various NHTSA BodyClass strings to Smart Capture BodyStyles', () => {
    expect(mapNhtsaToBodyStyle('Pickup', 'Truck')).toBe('truck');
    expect(mapNhtsaToBodyStyle('Crew Cab Pickup', 'Truck')).toBe('truck');
    expect(mapNhtsaToBodyStyle('Sport Utility Vehicle (SUV)', 'Passenger Car')).toBe('suv');
    expect(mapNhtsaToBodyStyle('Crossover Utility Vehicle', '')).toBe('suv');
    expect(mapNhtsaToBodyStyle('Coupe', '')).toBe('coupe');
    expect(mapNhtsaToBodyStyle('Convertible/Cabriolet', '')).toBe('convertible');
    expect(mapNhtsaToBodyStyle('Minivan', '')).toBe('van');
    expect(mapNhtsaToBodyStyle('Hatchback', '')).toBe('hatchback');
    expect(mapNhtsaToBodyStyle('Station Wagon', '')).toBe('wagon');
    expect(mapNhtsaToBodyStyle('Sedan', 'Passenger Car')).toBe('sedan');
    expect(mapNhtsaToBodyStyle('', '')).toBe('sedan');
  });

  it('fetches and parses decoded vehicle fields from NHTSA vPIC response', async () => {
    const mockNhtsaResponse = {
      Results: [
        {
          ModelYear: '2023',
          Make: 'BMW',
          Model: '330i xDrive',
          Trim: 'M Sport',
          BodyClass: 'Sedan',
          VehicleType: 'PASSENGER CAR',
          Manufacturer: 'BMW AG',
          PlantCountry: 'GERMANY',
          ErrorCode: '0',
          ErrorText: '0 - VIN decoded clean',
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockNhtsaResponse,
    });

    const result = await decodeVinWithNhtsa('WBA5R1C56NFP00000');
    expect(result.year).toBe(2023);
    expect(result.make).toBe('BMW');
    expect(result.model).toBe('330i xDrive');
    expect(result.trim).toBe('M Sport');
    expect(result.suggestedBodyStyle).toBe('sedan');
    expect(result.manufacturer).toBe('BMW AG');
    expect(result.plantCountry).toBe('GERMANY');
  });

  it('handles network failure gracefully without throwing', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

    const result = await decodeVinWithNhtsa('1HGCR2F83HA000000');
    expect(result.errorCode).toBe('NETWORK_ERROR');
    expect(result.errorText).toContain('Network offline');
    expect(result.suggestedBodyStyle).toBe('sedan');
  });
});
