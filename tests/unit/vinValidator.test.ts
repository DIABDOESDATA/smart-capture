import { describe, it, expect } from 'vitest';
import { validateVin } from '@/services/vin/vinValidator';

describe('VIN Validator (ISO 3779 / 49 CFR Part 565)', () => {
  it('validates a correct modern 17-character VIN with valid check digit', () => {
    // Valid Honda Accord VIN (Check digit at index 8 is '5')
    const validVin = '1HGCR2F85HA000000';
    const result = validateVin(validVin);

    expect(result.cleanVin).toBe('1HGCR2F85HA000000');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.checkDigit).toBe('5');
    expect(result.expectedCheckDigit).toBe('5');
  });

  it('detects check digit mismatch when position 9 is altered', () => {
    // Alter position 9 from '5' to '9'
    const invalidVin = '1HGCR2F89HA000000';
    const result = validateVin(invalidVin);

    expect(result.isValid).toBe(false);
    expect(result.checkDigit).toBe('9');
    expect(result.expectedCheckDigit).toBe('5');
    expect(result.errors[0]).toContain('Check digit mismatch');
  });

  it('rejects VINs with invalid lengths', () => {
    const shortVin = '1HGCR2F83HA';
    const result = validateVin(shortVin);

    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('must be exactly 17 characters');
  });

  it('flags forbidden characters (I, O, Q) and provides OCR correction suggestions', () => {
    // User scanned 'O' and 'I' by OCR error
    const ocrConfusedVin = '1HGCR2F85HAO0000I';
    const result = validateVin(ocrConfusedVin);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('disallowed in standard VINs'))).toBe(true);
    // Suggests replacing O with 0 and I with 1
    expect(result.suggestedCorrection).toBe('1HGCR2F85HA000001');
  });

  it('normalizes lowercase letters and whitespace', () => {
    const spacedVin = ' 1hgcr2f85ha000000 ';
    const result = validateVin(spacedVin);

    expect(result.cleanVin).toBe('1HGCR2F85HA000000');
    expect(result.isValid).toBe(true);
  });
});
