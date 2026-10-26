/**
 * North American VIN Check Digit and Validation Utility
 * Adheres to ISO 3779 / 49 CFR Part 565 standards.
 */
const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
const TRANSLITERATION_MAP: Record<string, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
  G: 7,
  H: 8,
  J: 1,
  K: 2,
  L: 3,
  M: 4,
  N: 5,
  P: 7,
  R: 9,
  S: 2,
  T: 3,
  U: 4,
  V: 5,
  W: 6,
  X: 7,
  Y: 8,
  Z: 9,
  '0': 0,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
};
export interface VinValidationResult {
  isValid: boolean;
  cleanVin: string;
  checkDigit: string;
  expectedCheckDigit?: string;
  errors: string[];
  suggestedCorrection?: string;
}
/**
 * Validates a 17-character VIN including ISO 3779 Modulus 11 check digit verification.
 */
export function validateVin(rawVin: string): VinValidationResult {
  if (!rawVin) {
    return {
      isValid: false,
      cleanVin: '',
      checkDigit: '',
      errors: ['VIN cannot be empty'],
    };
  }
  // Normalize: uppercase and remove spaces/dashes
  const cleanVin = rawVin.toUpperCase().replace(/[\s-]/g, '');
  const errors: string[] = [];
  if (cleanVin.length !== 17) {
    errors.push(`VIN must be exactly 17 characters (received ${cleanVin.length})`);
    return {
      isValid: false,
      cleanVin,
      checkDigit: '',
      errors,
    };
  }
  // Check for forbidden characters (I, O, Q are not permitted in standard modern VINs)
  const forbiddenChars = cleanVin.match(/[IOQ]/g);
  let suggestedCorrection: string | undefined = undefined;
  if (forbiddenChars) {
    errors.push(
      `VIN contains invalid characters: ${Array.from(new Set(forbiddenChars)).join(', ')} (I, O, Q are disallowed in standard VINs)`
    );
    // Suggest OCR correction (e.g. O -> 0, I -> 1)
    suggestedCorrection = cleanVin.replace(/O/g, '0').replace(/Q/g, '0').replace(/I/g, '1');
  }
  // Calculate check digit (Position 9, 0-indexed index 8)
  const checkDigitChar = cleanVin[8];
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const char = cleanVin[i];
    const val = TRANSLITERATION_MAP[char];
    if (val === undefined) {
      errors.push(`Invalid character at position ${i + 1}: '${char}'`);
      return {
        isValid: false,
        cleanVin,
        checkDigit: checkDigitChar,
        errors,
        suggestedCorrection,
      };
    }
    sum += val * VIN_WEIGHTS[i];
  }
  const remainder = sum % 11;
  const expectedCheckDigit = remainder === 10 ? 'X' : String(remainder);
  if (checkDigitChar !== expectedCheckDigit) {
    errors.push(
      `Check digit mismatch at position 9: got '${checkDigitChar}', expected '${expectedCheckDigit}'`
    );
  }
  return {
    isValid: errors.length === 0,
    cleanVin,
    checkDigit: checkDigitChar,
    expectedCheckDigit,
    errors,
    suggestedCorrection,
  };
}
